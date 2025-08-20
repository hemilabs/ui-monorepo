import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { EligibilityData } from 'tge-claim'
import { isClaimable } from 'tge-claim/actions'
import { useAccount } from 'wagmi'

export const getIsClaimableQueryKey = ({
  address,
  amount,
  claimGroupId,
  hemiId,
  proof = [],
}: EligibilityData & {
  hemiId: number
}) => [
  'hemi-token-is-claimable',
  address,
  amount.toString(),
  hemiId,
  claimGroupId,
  ...proof,
]

/**
 * Checks if the user can claim given eligibility data. Note that if it returns false,
 * it means either the user already claimed, or that they were not eligible (for example, the proof is invalid).
 * @param eligibility
 */
export const useIsClaimable = function (eligibility: EligibilityData) {
  const { address } = useAccount()
  const hemiPublicClient = useHemiClient()
  const hemi = useHemi()

  const amount = BigInt(eligibility.amount)

  return useQuery({
    enabled:
      !!address && !!hemiPublicClient && eligibility.claimGroupId !== undefined,
    queryFn: () =>
      isClaimable({
        address,
        amount,
        chainId: hemi.id,
        claimGroupId: eligibility.claimGroupId,
        client: hemiPublicClient,
        proof: eligibility.proof,
      }),
    queryKey: getIsClaimableQueryKey({
      address,
      amount,
      claimGroupId: eligibility.claimGroupId,
      hemiId: hemi.id,
      proof: eligibility.proof,
    }),
  })
}
