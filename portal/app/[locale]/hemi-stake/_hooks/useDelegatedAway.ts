import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { type StakingPosition } from 'types/stakingDashboard'
import { getPositionsDelegatedAway } from 've-hemi-actions/actions'
import { type Address, type Chain } from 'viem'
import { useAccount } from 'wagmi'

const fiveMinutes = 1000 * 60 * 5

export const getDelegatedAwayQueryKeyPrefix = ({
  chainId,
  ownerAddress,
}: {
  chainId: Chain['id']
  ownerAddress: Address | undefined
}) => [
  'staking-positions-delegated-away',
  chainId.toString(),
  ownerAddress?.toLowerCase(),
]

const getDelegatedAwayQueryKey = ({
  chainId,
  ownerAddress,
  tokenIds,
}: {
  chainId: Chain['id']
  ownerAddress: Address | undefined
  tokenIds: string[]
}) => [...getDelegatedAwayQueryKeyPrefix({ chainId, ownerAddress }), tokenIds]

export const useDelegatedAway = function (
  positions: StakingPosition[] | undefined,
) {
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()
  const { address: ownerAddress } = useAccount()

  return useQuery({
    enabled: positions !== undefined && !!ownerAddress,
    queryFn: () =>
      getPositionsDelegatedAway({
        client: hemiClient,
        ownerAddress: ownerAddress!,
        tokenIds: positions!.map(position => position.tokenId),
      }),
    queryKey: getDelegatedAwayQueryKey({
      chainId,
      ownerAddress,
      tokenIds: (positions ?? []).map(position => position.tokenId.toString()),
    }),
    refetchInterval: fiveMinutes,
    retry: 2,
    staleTime: fiveMinutes,
  })
}
