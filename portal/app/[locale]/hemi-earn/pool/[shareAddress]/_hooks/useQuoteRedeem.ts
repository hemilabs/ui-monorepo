import { useQuery } from '@tanstack/react-query'
import {
  getHemiEarnAgentAddress,
  getHemiEarnRouterAddress,
  getStakingVaultForShare,
} from 'hemi-earn-actions'
import {
  getAssetData,
  quoteRedeem,
  quoteRedeemFulfillment,
  resolveIsInstant,
} from 'hemi-earn-actions/actions'
import { hemi } from 'hemi-viem'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient, getPublicClient } from 'utils/chainClients'
import { type Address } from 'viem'

type QuoteRedeem = {
  callbackFee: bigint
  // Whether the Router should reserve gas for the instant-redeem path. Must
  // match the vault's actual state for `account` — resolved on-chain via
  // `resolveIsInstant`. Consumers pass this through to `requestRedeem` /
  // `encodeRequestRedeem` so the request body and the gas reservation agree.
  isInstant: boolean
  nativeFee: bigint
}

// Mirror of useQuoteDeposit for the redeem leg: resolves the redeem path
// (instant vs cooldown) on Ethereum, then Agent.quoteRedeemFulfillment on
// Ethereum, then Router.quoteRedeem on Hemi with the resolved `isInstant`.
export const useQuoteRedeem = ({
  account,
  asset,
  shareAddress,
  shares,
}: {
  // The address that will submit `requestRedeem`. Required to evaluate the
  // vault's `instantWithdrawWhitelist(account)` on the remote chain.
  account: Address | undefined
  asset: Address
  shareAddress: Address
  shares: bigint
}) =>
  useQuery<QuoteRedeem>({
    enabled: shares > BigInt(0) && !!account,
    async queryFn() {
      const ethereumClient = getEvmL1PublicClient(mainnet.id)
      const hemiClient = getPublicClient(hemi.id)
      // `Agent.quoteRedeemFulfillment` lives on Ethereum and needs the
      // *remote* asset address (the OFT registered on the Agent), not the
      // Hemi-side asset OFT the user holds. Resolve via the Router's
      // `assetsData(asset).remoteAsset`. Runs in parallel with the staking
      // vault read on Ethereum — they are independent.
      const [isInstant, assetData] = await Promise.all([
        resolveIsInstant({
          caller: account!,
          client: ethereumClient,
          stakingVault: getStakingVaultForShare(shareAddress),
        }),
        getAssetData({
          asset,
          client: hemiClient,
          routerAddress: getHemiEarnRouterAddress(),
        }),
      ])
      const callbackFee = await quoteRedeemFulfillment({
        agentAddress: getHemiEarnAgentAddress(),
        asset: assetData.remoteAsset,
        client: ethereumClient,
      })
      const nativeFee = await quoteRedeem({
        asset,
        callbackFee,
        client: hemiClient,
        isInstant,
        routerAddress: getHemiEarnRouterAddress(),
        shares,
      })
      return { callbackFee, isInstant, nativeFee }
    },
    queryKey: [
      'hemi-earn',
      'quote-redeem',
      shareAddress,
      asset,
      account,
      shares.toString(),
    ],
  })
