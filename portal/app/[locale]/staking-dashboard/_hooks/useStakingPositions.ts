import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { StakingPosition } from 'types/stakingDashboard'
import { Address, Chain } from 'viem'
import { useAccount } from 'wagmi'

type ApiPosition = Omit<
  StakingPosition,
  | 'amount'
  | 'blockNumber'
  | 'blockTimestamp'
  | 'lockTime'
  | 'timestamp'
  | 'tokenId'
> & {
  amount: string
  blockNumber: string
  blockTimestamp: string
  lockTime: string
  timestamp: string
  tokenId: string
}

type ApiResponse = {
  positions: ApiPosition[]
}

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
  const { address } = useAccount()
  const hemi = useHemi()

  return useQuery({
    enabled: !!address,
    async queryFn() {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUBGRAPHS_API_URL}/${hemi.id}/locks/${address}`,
      ).catch(() => ({ ok: false }) as Response)
      if (!response.ok) {
        return []
      }

      const data: ApiResponse = await response.json()

      const positions = data.positions.map(
        position =>
          ({
            ...position,
            amount: BigInt(position.amount),
            blockNumber: BigInt(position.blockNumber),
            blockTimestamp: BigInt(position.blockTimestamp),
            lockTime: BigInt(position.lockTime),
            timestamp: BigInt(position.timestamp),
            tokenId: BigInt(position.tokenId),
          }) as StakingPosition,
      )

      return positions
    },
    queryKey: getStakingPositionsQueryKey({
      address,
      chainId: hemi.id,
    }),
    ...options,
  })
}
