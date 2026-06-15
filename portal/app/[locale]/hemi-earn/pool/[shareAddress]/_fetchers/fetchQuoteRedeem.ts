import { type QueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { getHemiEarnRouterAddress } from 'hemi-earn-actions'
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

import { shareConfigQueryOptions } from '../../../_fetchers/fetchHemiEarnAssetConfigs'
import { agentAddressQueryOptions } from '../../../_hooks/useHemiEarnAgentAddress'

export type QuoteRedeem = {
  callbackFee: bigint
  isInstant: boolean
  nativeFee: bigint
}

export type QuoteRedeemParams = {
  account: Address
  asset: Address
  queryClient: QueryClient
  shareAddress: Address
  shares: bigint
}

// Mirror of `fetchQuoteDeposit`: resolves the redeem path (instant vs
// cooldown) on Ethereum, then `Agent.quoteRedeemFulfillment` on Ethereum,
// then `Router.quoteRedeem` on Hemi with the resolved `isInstant`. Plain
// async so it stays callable outside of react-query.
export async function fetchQuoteRedeem({
  account,
  asset,
  queryClient,
  shareAddress,
  shares,
}: QuoteRedeemParams): Promise<QuoteRedeem> {
  const ethereumClient = getEvmL1PublicClient(mainnet.id)
  const hemiClient = getPublicClient(hemi.id)
  const { remoteShare } = await queryClient.ensureQueryData(
    shareConfigQueryOptions(shareAddress),
  )
  const [isInstant, assetData, agentAddress] = await Promise.all([
    resolveIsInstant({
      caller: account,
      client: ethereumClient,
      stakingVault: remoteShare,
    }),
    getAssetData(hemiClient, {
      asset,
      routerAddress: getHemiEarnRouterAddress(),
    }),
    queryClient.ensureQueryData(agentAddressQueryOptions()),
  ])
  const callbackFee = await quoteRedeemFulfillment({
    agentAddress,
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
}

export type QuoteRedeemHookParams = Omit<QuoteRedeemParams, 'account'> & {
  account: Address | undefined
}

const getQuoteRedeemQueryKey = ({
  account,
  asset,
  shareAddress,
  shares,
}: Omit<QuoteRedeemHookParams, 'queryClient'>) =>
  [
    'hemi-earn',
    'quote-redeem',
    shareAddress,
    asset,
    account,
    shares.toString(),
  ] as const

export const quoteRedeemOptions = ({
  account,
  asset,
  queryClient,
  shareAddress,
  shares,
}: QuoteRedeemHookParams): UseQueryOptions<QuoteRedeem> => ({
  enabled: shares > BigInt(0) && !!account,
  // The `enabled` flag above guarantees `account` is defined when this runs.
  queryFn: () =>
    fetchQuoteRedeem({
      account: account!,
      asset,
      queryClient,
      shareAddress,
      shares,
    }),
  queryKey: getQuoteRedeemQueryKey({ account, asset, shareAddress, shares }),
})
