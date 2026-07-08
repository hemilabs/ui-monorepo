'use client'

import { queryOptions } from '@tanstack/react-query'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address } from 'viem'
import { totalAssets } from 'viem-erc4626/actions'

// Exported so mutations can invalidate after settling. Keyed by the staking vault (the address actually read), not the share OFT.
export const earnTvlQueryKey = ({
  networkType,
  stakingVault,
}: {
  networkType: string
  stakingVault: Address
}) => ['hemi-earn', 'pools', networkType, stakingVault, 'totalAssets']

export const earnTvlQueryOptions = ({
  networkType,
  stakingVault,
}: {
  networkType: string
  stakingVault: Address
}) =>
  queryOptions({
    queryFn: () =>
      totalAssets(getEvmL1PublicClient(mainnet.id), {
        address: stakingVault,
      }),
    queryKey: earnTvlQueryKey({ networkType, stakingVault }),
    retry: false,
  })
