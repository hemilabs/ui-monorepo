import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { getRewardTokens } from 've-hemi-rewards/actions'
import { Chain } from 'viem'

const getRewardTokensQueryKey = ({ chainId }: { chainId: Chain['id'] }) => [
  'rewardTokens',
  chainId,
]

export const useRewardTokensAddresses = function ({
  enabled = true,
}: {
  enabled?: boolean
} = {}) {
  const hemiClient = useHemiClient()
  const { id } = useHemi()

  const queryKey = getRewardTokensQueryKey({
    chainId: id,
  })

  return useQuery({
    enabled,
    queryFn: () => getRewardTokens(hemiClient),
    queryKey,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
