import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { getPositionVotingPowerDetails } from 've-hemi-actions/actions'
import type { Address, Chain } from 'viem'
import { useAccount } from 'wagmi'

export const getPositionDelegationDetailsQueryKey = ({
  chainId,
  ownerAddress,
  tokenId,
}: {
  chainId: Chain['id']
  ownerAddress: Address | undefined
  tokenId: bigint
}) => [
  'position-delegation-details',
  chainId,
  ownerAddress?.toLowerCase(),
  tokenId.toString(),
]

export const usePositionDelegationDetails = function (tokenId: bigint) {
  const { hemiWalletClient } = useHemiWalletClient()
  const { address } = useAccount()
  const chainId = useHemi().id

  return useQuery({
    enabled: !!hemiWalletClient && !!address && tokenId > BigInt(0),
    queryFn: () =>
      getPositionVotingPowerDetails({
        client: hemiWalletClient!,
        ownerAddress: address!,
        tokenId,
      }),
    queryKey: getPositionDelegationDetailsQueryKey({
      chainId,
      ownerAddress: address,
      tokenId,
    }),
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  })
}
