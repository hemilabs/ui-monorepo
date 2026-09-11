import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { StakingPosition } from 'types/stakingDashboard'
import { getLockedPositions } from 'utils/subgraph'
import { Address, Chain } from 'viem'
import { useAccount } from 'wagmi'

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

  return useQuery({
    enabled: !!ownerAddress,
    queryFn: () =>
      getLockedPositions({
        address: ownerAddress!,
        chainId: hemi.id,
      }),
    queryKey: getStakingPositionsQueryKey({
      address: ownerAddress,
      chainId: hemi.id,
    }),
    ...options,
  })
}
