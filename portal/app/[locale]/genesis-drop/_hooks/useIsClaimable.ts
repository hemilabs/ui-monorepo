import { useQuery } from '@tanstack/react-query'
import { EligibilityData } from 'genesis-drop-actions'
import { isClaimable } from 'genesis-drop-actions/actions'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
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

  const { amount } = eligibility

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
