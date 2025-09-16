import { useQuery } from '@tanstack/react-query'
import fetch from 'fetch-plus-plus'
import { type EligibilityData } from 'genesis-drop-actions'
import { hemi as hemiMainnet } from 'hemi-viem'
import { useHemi } from 'hooks/useHemi'
import { getAddress as toChecksumAddress } from 'viem'
import { useAccount } from 'wagmi'

import { filterExclusiveGroups } from '../_utils'

const portalApiUrl = process.env.NEXT_PUBLIC_PORTAL_API_URL

const byClaimGroupId = (a: EligibilityData, b: EligibilityData) =>
  a.claimGroupId - b.claimGroupId

export const useAllEligibleForTokens = function ({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const { address } = useAccount()
  const hemi = useHemi()

  return useQuery({
    enabled: enabled && !!address,
    async queryFn() {
      const response = await fetch(
        `${portalApiUrl}/claims/${hemi.id}/${toChecksumAddress(address!)}/all`,
      )
        .catch(() => [])
        .then(
          (
            claimGroups: Array<{
              amount: number
              claimGroupId: number
              proof?: string[]
            }>,
          ) =>
            claimGroups.map(
              ({ amount, claimGroupId, proof = [] }) =>
                ({
                  address,
                  amount: BigInt(amount),
                  claimGroupId,
                  proof,
                }) as EligibilityData,
            ),
        )

      if (response.length === 0) {
        return response
      }

      // Filter exclusive groups on mainnet
      const filteredResponse = (
        hemi.id === hemiMainnet.id ? filterExclusiveGroups(response) : response
      ).sort(byClaimGroupId)

      return filteredResponse
    },
    queryKey: ['allEligibleForTokens', hemi.id, address],
  })
}
