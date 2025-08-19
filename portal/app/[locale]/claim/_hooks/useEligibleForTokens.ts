import { useQuery } from '@tanstack/react-query'
import fetch from 'fetch-plus-plus'
import { useHemi } from 'hooks/useHemi'
import { EligibilityData } from 'tge-claim'
import { useAccount } from 'wagmi'

const portalApiUrl = process.env.NEXT_PUBLIC_PORTAL_API_URL

export const useEligibleForTokens = function () {
  const { address } = useAccount()
  const hemi = useHemi()

  return useQuery({
    enabled: !!address,
    queryFn: () =>
      fetch(`${portalApiUrl}/claims/${hemi.id}/${address}`)
        .catch(() => ({
          amount: 0,
        }))
        .then(({ amount, claimGroupId, proof = [] }) => ({
          address,
          amount: BigInt(amount),
          claimGroupId,
          proof,
        })) as Promise<EligibilityData>,
    queryKey: ['eligibleForTokens', hemi.id, address],
  })
}
