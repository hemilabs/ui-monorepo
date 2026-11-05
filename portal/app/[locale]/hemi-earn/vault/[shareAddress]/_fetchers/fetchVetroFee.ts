import { type QueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { getMintFee, getRedeemFee } from '@vetro-protocol/gateway/actions'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address } from 'viem'

import { gatewayForShareQueryOptions } from '../../../_hooks/gatewayForShare'
import { assetDataQueryOptions } from '../../../_hooks/useAssetData'
import { bpsToPercent } from '../../../_utils/fees'
import { type VaultOperation } from '../_types/operations'

export type VetroFeeParams = {
  asset: Address
  operation: VaultOperation
  queryClient: QueryClient
  shareAddress: Address
}

export async function fetchVetroFee({
  asset,
  operation,
  queryClient,
  shareAddress,
}: VetroFeeParams) {
  const [gateway, assetData] = await Promise.all([
    queryClient.ensureQueryData(gatewayForShareQueryOptions(shareAddress)),
    queryClient.ensureQueryData(assetDataQueryOptions(asset)),
  ])
  const readFee = operation === 'deposit' ? getMintFee : getRedeemFee
  const feeBps = await readFee(getEvmL1PublicClient(mainnet.id), {
    address: gateway,
    token: assetData.remoteAsset,
  })
  return bpsToPercent(feeBps)
}

const getVetroFeeQueryKey = ({
  asset,
  operation,
  shareAddress,
}: VetroFeeParams) =>
  ['hemi-earn', 'vetro-fee', shareAddress, asset, operation] as const

export const vetroFeeQueryOptions = (
  params: VetroFeeParams,
): UseQueryOptions<number> => ({
  queryFn: () => fetchVetroFee(params),
  queryKey: getVetroFeeQueryKey(params),
  staleTime: 1000 * 60 * 5,
})
