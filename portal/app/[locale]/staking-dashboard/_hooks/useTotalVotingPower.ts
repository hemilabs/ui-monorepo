import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { getTotalVotingPower } from 've-hemi-actions/actions'
import type { Address } from 'viem'
import { useAccount } from 'wagmi'

export const getTotalVotingPowerQueryKey = ({
  address,
  chainId,
}: {
  address?: Address
  chainId: number
}) => ['total-voting-power', chainId, address?.toLowerCase()]

export const useTotalVotingPower = function () {
  const { hemiWalletClient } = useHemiWalletClient()
  const { address: ownerAddress } = useAccount()
  const chainId = useHemi().id

  return useQuery({
    enabled: !!hemiWalletClient && !!ownerAddress,
    queryFn: () =>
      getTotalVotingPower({
        client: hemiWalletClient!,
        ownerAddress: ownerAddress!,
      }),
    queryKey: getTotalVotingPowerQueryKey({
      address: ownerAddress,
      chainId,
    }),
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  })
}
