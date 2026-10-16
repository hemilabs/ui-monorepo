import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { getLivePositionClass } from 've-hemi-actions/actions'

export const usePositionClass = function (tokenId: bigint) {
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()

  return useQuery({
    enabled: tokenId > BigInt(0),
    queryFn: () => getLivePositionClass(hemiClient, tokenId),
    queryKey: ['livePositionClass', chainId, tokenId.toString()],
    select: ({ forfeitable, transferableAfter }) => ({
      forfeitable,
      transferableAfter: Number(transferableAfter),
    }),
    staleTime: Infinity,
  })
}
