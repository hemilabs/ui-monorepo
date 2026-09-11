import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { getPositionVotingPowerDetails } from 've-hemi-actions/actions'
import type { Address, Chain } from 'viem'
import { useAccount } from 'wagmi'

type PositionDelegationDetails = Awaited<
  ReturnType<typeof getPositionVotingPowerDetails>
>

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

export const usePositionDelegationDetails = function <
  TData = PositionDelegationDetails,
>(
  tokenId: bigint,
  {
    enabled: enabledFromCaller = true,
    select,
  }: {
    /** When false, skips the on-chain query (e.g. row not owned by connected wallet). */
    enabled?: boolean
    select?: (data: PositionDelegationDetails) => TData
  } = {},
) {
  const hemiClient = useHemiClient()
  const { address: ownerAddress } = useAccount()
  const chainId = useHemi().id

  const canFetch = !!ownerAddress && tokenId > BigInt(0) && enabledFromCaller

  return useQuery({
    enabled: canFetch,
    queryFn: () =>
      getPositionVotingPowerDetails({
        client: hemiClient,
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
    select,
  })
}
