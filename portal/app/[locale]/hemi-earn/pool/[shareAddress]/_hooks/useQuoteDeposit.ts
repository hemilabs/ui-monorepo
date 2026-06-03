import { useQuery } from '@tanstack/react-query'
import { previewDeposit } from '@vetro-protocol/gateway/actions'
import {
  getGatewayForShare,
  getHemiEarnAgentAddress,
  getHemiEarnRouterAddress,
  getStakingVaultForShare,
} from 'hemi-earn-actions'
import {
  getAssetData,
  quoteDeposit,
  quoteDepositFulfillment,
} from 'hemi-earn-actions/actions'
import { hemi } from 'hemi-viem'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient, getHemiClient } from 'utils/chainClients'
import { type Address } from 'viem'

type QuoteDeposit = {
  callbackFee: bigint
  nativeFee: bigint
  // Pegged-token amount the vault will receive for this deposit
  // (`Gateway.previewDeposit(remoteAsset, amount)`). Used by `useDeposit` to
  // optimistically bump `totalAssets()` in its native unit.
  peggedAmount: bigint
}

// Chains the contract reads needed to know the user's true cost on Hemi
// plus the pegged-token equivalent of the deposit:
//   1. Agent.quoteDepositFulfillment(share) on Ethereum — the LayerZero fee
//      the Agent will need to OFT the sVetToken shares back to Hemi. The
//      `share` arg is the Ethereum-side staking vault (resolved from the
//      Hemi-side share OFT via `getStakingVaultForShare`).
//   2. Router.assetsData(asset).remoteAsset on Hemi — the Ethereum-side
//      counterpart of the Hemi-side deposit asset. Needed because the Vetro
//      Gateway lives on Ethereum and only knows the remote asset address.
//   3. Router.quoteDeposit(asset, assets, callbackFee) on Hemi — the
//      total `msg.value` the user attaches to `requestDeposit`.
//   4. Gateway.previewDeposit(remoteAsset, amount) on Ethereum — the
//      pegged-token amount that lands in the vault, used for the optimistic
//      TVL update. The remote asset comes from step 2.
// The Router can't compute callbackFee itself (it lives on Hemi while the
// Agent lives on Ethereum), so this hook is the source of truth for the
// LayerZero leg of the fees.
export const useQuoteDeposit = ({
  amount,
  asset,
  shareAddress,
}: {
  amount: bigint
  asset: Address
  shareAddress: Address
}) =>
  useQuery<QuoteDeposit>({
    enabled: amount > BigInt(0),
    async queryFn() {
      const ethereumClient = getEvmL1PublicClient(mainnet.id)
      const hemiClient = getHemiClient(hemi.id)
      const [callbackFee, assetData] = await Promise.all([
        quoteDepositFulfillment({
          agentAddress: getHemiEarnAgentAddress(),
          client: ethereumClient,
          share: getStakingVaultForShare(shareAddress),
        }),
        getAssetData({
          asset,
          client: hemiClient,
          routerAddress: getHemiEarnRouterAddress(),
        }),
      ])
      const [nativeFee, peggedAmount] = await Promise.all([
        quoteDeposit({
          asset,
          assets: amount,
          callbackFee,
          client: hemiClient,
          routerAddress: getHemiEarnRouterAddress(),
        }),
        previewDeposit(ethereumClient, {
          address: getGatewayForShare(shareAddress),
          amountIn: amount,
          tokenIn: assetData.remoteAsset,
        }),
      ])
      return { callbackFee, nativeFee, peggedAmount }
    },
    queryKey: [
      'hemi-earn',
      'quote-deposit',
      shareAddress,
      asset,
      amount.toString(),
    ],
  })
