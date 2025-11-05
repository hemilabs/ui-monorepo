import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiWalletClient } from 'hooks/useHemiClient'
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
  const { hemiWalletClient } = useHemiWalletClient()
  const { id } = useHemi()

  const queryKey = getRewardTokensQueryKey({
    chainId: id,
  })

  return useQuery({
    enabled: enabled && !!hemiWalletClient,
    queryFn: () => getRewardTokens(hemiWalletClient!),
    queryKey,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
