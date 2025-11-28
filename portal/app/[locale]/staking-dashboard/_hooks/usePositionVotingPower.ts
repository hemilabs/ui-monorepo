import { useQuery } from '@tanstack/react-query'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { getPositionVotingPower } from 've-hemi-actions/actions'
import { useAccount } from 'wagmi'

export const getPositionVotingPowerQueryKey = ({
  tokenId,
}: {
  tokenId: bigint
}) => ['position-voting-power', tokenId.toString()]

export const usePositionVotingPower = function (tokenId: bigint) {
  const { hemiWalletClient } = useHemiWalletClient()
  const { address } = useAccount()

  return useQuery({
    enabled: !!hemiWalletClient && !!address && tokenId > BigInt(0),
    queryFn: () =>
      getPositionVotingPower({
        client: hemiWalletClient!,
        ownerAddress: address!,
        tokenId,
      }),
    queryKey: getPositionVotingPowerQueryKey({
      tokenId,
    }),
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  })
}
