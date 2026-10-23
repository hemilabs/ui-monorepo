import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { StakingPosition } from 'types/stakingDashboard'
import { Address, Chain } from 'viem'
import { useAccount } from 'wagmi'

import { fetchStakingPositions } from '../_fetchers/fetchStakingPositions'

export const getStakingPositionsQueryKey = ({
  address,
  chainId,
}: {
  address?: Address
  chainId: Chain['id']
}) => ['staking-positions', chainId.toString(), address?.toString()]

export const useStakingPositions = function (
  options: Omit<
    UseQueryOptions<StakingPosition[]>,
    'enabled' | 'queryFn' | 'queryKey'
  > = {},
) {
  const { address: ownerAddress } = useAccount()
  const hemi = useHemi()
  const hemiClient = useHemiClient()

  return useQuery({
    enabled: !!ownerAddress,
    queryFn: () =>
      fetchStakingPositions({
        address: ownerAddress!,
        chainId: hemi.id,
        hemiClient,
      }),
    queryKey: getStakingPositionsQueryKey({
      address: ownerAddress,
      chainId: hemi.id,
    }),
    ...options,
  })
}
