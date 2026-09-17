import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { getPositionClass } from 've-hemi-epoch-rewards/actions'

/**
 * Whether unlocking this position still has to record its class first.
 *
 * Burning a position whose class was never recorded makes its unclaimed rewards
 * unpayable, so the unlock signs that capture first. Reading it up front is how the
 * review drawer knows the unlock is two transactions before the first one is signed.
 */
export const useNeedsClassCapture = function (tokenId: bigint) {
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()

  return useQuery({
    enabled: tokenId > BigInt(0),
    queryFn: () => getPositionClass(hemiClient, { tokenId }),
    queryKey: ['positionClass', chainId, tokenId.toString()],
    select: ([, , captured]) => !captured,
    staleTime: 5 * 60 * 1000,
  })
}
