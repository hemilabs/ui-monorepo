import { useQuery } from '@tanstack/react-query'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { getPositionVotingPower } from 've-hemi-actions/actions'
import type { Chain } from 'viem'
import { useAccount } from 'wagmi'

export const getPositionVotingPowerQueryKey = ({
  chainId,
  tokenId,
}: {
  chainId: Chain['id']
  tokenId: bigint
}) => ['position-voting-power', chainId, tokenId.toString()]

export const usePositionVotingPower = function (tokenId: bigint) {
  const { hemiWalletClient } = useHemiWalletClient()
  const { address, chainId } = useAccount()

  return useQuery({
    enabled:
      !!hemiWalletClient && !!address && !!chainId && tokenId > BigInt(0),
    queryFn: () =>
      getPositionVotingPower({
        client: hemiWalletClient!,
        ownerAddress: address!,
        tokenId,
      }),
    queryKey: getPositionVotingPowerQueryKey({
      chainId: chainId!,
      tokenId,
    }),
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  })
}
