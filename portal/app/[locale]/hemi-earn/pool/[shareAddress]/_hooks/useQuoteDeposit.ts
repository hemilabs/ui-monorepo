import { useQuery } from '@tanstack/react-query'
import {
  getGatewayForShare,
  getHemiEarnAgentAddress,
  getHemiEarnRouterAddress,
} from 'hemi-earn-actions'
import {
  previewGatewayDeposit,
  quoteDeposit,
  quoteDepositFulfilment,
} from 'hemi-earn-actions/actions'
import { hemi } from 'hemi-viem'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient, getHemiClient } from 'utils/chainClients'
import { type Address } from 'viem'

type QuoteDeposit = {
  fulfillmentFee: bigint
  nativeFee: bigint
  // Pegged-token amount the vault will receive for this deposit
  // (`Gateway.previewDeposit(asset, amount)`). Used by `useDeposit` to
  // optimistically bump `totalAssets()` in its native unit.
  peggedAmount: bigint
}

// Chains the contract reads needed to know the user's true cost on Hemi
// plus the pegged-token equivalent of the deposit:
//   1. Agent.quoteDepositFulfilment(asset) on Ethereum — the LayerZero fee the
//      Agent will need to send the fulfillment response back to Hemi.
//   2. Router.quoteDeposit(asset, assets, fulfillmentFee) on Hemi — the
//      total `msg.value` the user attaches to `requestDeposit`.
//   3. Gateway.previewDeposit(asset, amount) on Ethereum — the pegged-token
//      amount that lands in the vault, used for the optimistic TVL update.
// The Router can't compute fulfillmentFee itself (it lives on Hemi while the
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
      const fulfillmentFee = await quoteDepositFulfilment({
        agentAddress: getHemiEarnAgentAddress(),
        asset,
        client: ethereumClient,
      })
      const [nativeFee, peggedAmount] = await Promise.all([
        quoteDeposit({
          asset,
          assets: amount,
          client: getHemiClient(hemi.id),
          fulfillmentFee,
          routerAddress: getHemiEarnRouterAddress(),
        }),
        previewGatewayDeposit({
          amountIn: amount,
          client: ethereumClient,
          gatewayAddress: getGatewayForShare(shareAddress),
          tokenIn: asset,
        }),
      ])
      return { fulfillmentFee, nativeFee, peggedAmount }
    },
    queryKey: [
      'hemi-earn',
      'quote-deposit',
      shareAddress,
      asset,
      amount.toString(),
    ],
  })
