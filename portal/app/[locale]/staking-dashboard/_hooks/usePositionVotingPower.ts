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
  ownerAddress: Address | undefined
  tokenId: bigint
}) => [
  'position-voting-power',
  chainId,
  ownerAddress?.toLowerCase(),
  tokenId.toString(),
]

export const usePositionVotingPower = function (tokenId: bigint) {
  const { hemiWalletClient } = useHemiWalletClient()
  const { address: ownerAddress } = useAccount()
  const chainId = useHemi().id

  return useQuery({
    enabled: !!hemiWalletClient && !!ownerAddress && tokenId > BigInt(0),
    queryFn: () =>
      getPositionVotingPower({
        client: hemiWalletClient!,
        ownerAddress: ownerAddress!,
        tokenId,
      }),
    queryKey: getPositionVotingPowerQueryKey({
      chainId,
      ownerAddress,
      tokenId,
    }),
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  })
}
