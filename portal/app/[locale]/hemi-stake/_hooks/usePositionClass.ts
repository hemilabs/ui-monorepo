import { useQuery } from '@tanstack/react-query'
import { useHemiClient } from 'hooks/useHemiClient'
import { getLivePositionClass } from 've-hemi-actions/actions'

export const usePositionClass = function ({
  tokenId,
  transferable,
}: {
  tokenId: bigint
  transferable: boolean | undefined
}) {
  const hemiClient = useHemiClient()

  return useQuery({
    enabled: transferable !== true && tokenId > BigInt(0),
    queryFn: () => getLivePositionClass(hemiClient, tokenId),
    queryKey: ['livePositionClass', hemiClient.chain.id, tokenId.toString()],
    select: ({ forfeitable, transferableAfter }) => ({
      forfeitable,
      transferableAfter: Number(transferableAfter),
    }),
    staleTime: Infinity,
  })
}
