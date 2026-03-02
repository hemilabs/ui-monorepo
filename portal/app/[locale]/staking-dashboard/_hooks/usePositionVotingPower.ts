import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { getPositionVotingPower } from 've-hemi-actions/actions'
import type { Address, Chain } from 'viem'
import { useAccount } from 'wagmi'

export const getPositionVotingPowerQueryKey = ({
  chainId,
  ownerAddress,
  tokenId,
}: {
  chainId: Chain['id']
  ownerAddress: Address
  tokenId: bigint
}) => ['position-voting-power', chainId, ownerAddress, tokenId.toString()]

export const usePositionVotingPower = function (tokenId: bigint) {
  const { hemiWalletClient } = useHemiWalletClient()
  const { address } = useAccount()
  const chainId = useHemi().id

  return useQuery({
    enabled: !!hemiWalletClient && !!address && tokenId > BigInt(0),
    queryFn: () =>
      getPositionVotingPower({
        client: hemiWalletClient!,
        ownerAddress: address!,
        tokenId,
      }),
    queryKey: getPositionVotingPowerQueryKey({
      chainId,
      ownerAddress: address!,
      tokenId,
    }),
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  })
}
