import { useQuery } from '@tanstack/react-query'
import { useHemiClient } from 'hooks/useHemiClient'
import { unixNowTimestamp } from 'utils/time'
import { getPositionWeight } from 've-hemi-actions/actions'
import type { Chain } from 'viem'

export const getPositionWeightQueryKey = ({
  chainId,
  tokenId,
}: {
  chainId: Chain['id']
  tokenId: bigint
}) => ['positionWeight', chainId, tokenId.toString()]

export const usePositionWeight = function (tokenId: bigint) {
  const hemiClient = useHemiClient()

  return useQuery({
    enabled: tokenId > BigInt(0),
    queryFn: () => getPositionWeight(hemiClient, tokenId, unixNowTimestamp()),
    queryKey: getPositionWeightQueryKey({
      chainId: hemiClient.chain.id,
      tokenId,
    }),
    refetchInterval: 1000 * 60 * 5,
    retry: 2,
  })
}
