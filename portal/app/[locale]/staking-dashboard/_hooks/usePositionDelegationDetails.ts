import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { getPositionVotingPowerDetails } from 've-hemi-actions/actions'
import type { Address, Chain } from 'viem'
import { useAccount } from 'wagmi'

const getPositionDelegationDetailsQueryKey = ({
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

type UsePositionDelegationDetailsOptions = {
  /** When false, skips the on-chain query (e.g. row not owned by connected wallet). */
  enabled?: boolean
}

export const usePositionDelegationDetails = function (
  tokenId: bigint,
  {
    enabled: enabledFromCaller = true,
  }: UsePositionDelegationDetailsOptions = {},
) {
  const { hemiWalletClient } = useHemiWalletClient()
  const { address: ownerAddress } = useAccount()
  const chainId = useHemi().id

  const canFetch =
    !!hemiWalletClient &&
    !!ownerAddress &&
    tokenId > BigInt(0) &&
    enabledFromCaller

  return useQuery({
    enabled: canFetch,
    queryFn: () =>
      getPositionVotingPowerDetails({
        client: hemiWalletClient!,
        ownerAddress: ownerAddress!,
        tokenId,
      }),
    queryKey: getPositionDelegationDetailsQueryKey({
      chainId,
      ownerAddress,
      tokenId,
    }),
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  })
}
