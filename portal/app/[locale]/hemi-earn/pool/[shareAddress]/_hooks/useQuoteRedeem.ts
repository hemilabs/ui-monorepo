import { useQuery } from '@tanstack/react-query'
import {
  getHemiEarnAgentAddress,
  getHemiEarnRouterAddress,
} from 'hemi-earn-actions'
import { quoteRedeem, quoteRedeemFulfillment } from 'hemi-earn-actions/actions'
import { hemi } from 'hemi-viem'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient, getHemiClient } from 'utils/chainClients'
import { type Address } from 'viem'

type QuoteRedeem = {
  fulfillmentFee: bigint
  nativeFee: bigint
}

// Mirror of useQuoteDeposit for the redeem leg: Agent.quoteRedeemFulfillment
// on Ethereum, then Router.quoteRedeem on Hemi.
export const useQuoteRedeem = ({
  asset,
  shares,
}: {
  asset: Address
  shares: bigint
}) =>
  useQuery<QuoteRedeem>({
    enabled: shares > BigInt(0),
    async queryFn() {
      const fulfillmentFee = await quoteRedeemFulfillment({
        agentAddress: getHemiEarnAgentAddress(),
        asset,
        client: getEvmL1PublicClient(mainnet.id),
      })
      const nativeFee = await quoteRedeem({
        asset,
        client: getHemiClient(hemi.id),
        fulfillmentFee,
        routerAddress: getHemiEarnRouterAddress(),
        shares,
      })
      return { fulfillmentFee, nativeFee }
    },
    queryKey: ['hemi-earn', 'quote-redeem', asset, shares.toString()],
  })
