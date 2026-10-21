import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { type StakingPosition } from 'types/stakingDashboard'
import { type Chain } from 'viem'

import { fetchPositionClasses } from '../_fetchers/fetchPositionClasses'

const getPositionClassesQueryKey = ({
  chainId,
  tokenIds,
}: {
  chainId: Chain['id']
  tokenIds: string[]
}) => ['staking-position-classes', chainId.toString(), tokenIds]

export const usePositionClasses = function (
  positions: StakingPosition[] | undefined,
) {
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()

  return useQuery({
    enabled: positions !== undefined,
    queryFn: () => fetchPositionClasses(hemiClient, { positions: positions! }),
    queryKey: getPositionClassesQueryKey({
      chainId,
      tokenIds: (positions ?? []).map(position => position.tokenId.toString()),
    }),
    staleTime: Infinity,
  })
}
