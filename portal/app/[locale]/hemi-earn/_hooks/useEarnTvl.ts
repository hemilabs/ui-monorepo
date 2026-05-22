'use client'

import { queryOptions } from '@tanstack/react-query'
import { getStakingVaultForShare } from 'hemi-earn-actions'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address } from 'viem'
import { totalAssets } from 'viem-erc4626/actions'

// Exported so deposit/withdraw mutations can invalidate this entry after
// settling on-chain.
export const earnTvlQueryKey = ({
  networkType,
  shareAddress,
}: {
  networkType: string
  shareAddress: string
}) => ['hemi-earn', 'pools', networkType, shareAddress, 'totalAssets']

export const earnTvlQueryOptions = ({
  networkType,
  shareAddress,
}: {
  networkType: string
  shareAddress: Address
}) =>
  queryOptions({
    queryFn: () =>
      totalAssets(getEvmL1PublicClient(mainnet.id), {
        address: getStakingVaultForShare(shareAddress),
      }),
    queryKey: earnTvlQueryKey({ networkType, shareAddress }),
    retry: false,
  })
