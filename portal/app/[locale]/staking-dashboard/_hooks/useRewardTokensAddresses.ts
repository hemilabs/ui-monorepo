import { useQuery } from '@tanstack/react-query'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { getRewardTokens } from 've-hemi-rewards/actions'
import { Chain } from 'viem'

const getRewardTokensQueryKey = ({ chainId }: { chainId: Chain['id'] }) => [
  'rewardTokens',
  chainId,
]

export const useRewardTokensAddresses = function ({
  chainId,
  enabled = true,
}: {
  chainId: Chain['id']
  enabled?: boolean
}) {
  const { hemiWalletClient } = useHemiWalletClient()

  const queryKey = getRewardTokensQueryKey({
    chainId,
  })

  return useQuery({
    enabled: enabled && !!hemiWalletClient,
    queryFn: () => getRewardTokens(hemiWalletClient!),
    queryKey,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
