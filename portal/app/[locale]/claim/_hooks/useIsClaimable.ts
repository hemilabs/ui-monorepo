import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { EligibilityData } from 'tge-claim'
import { checkIsClaimable } from 'tge-claim/actions'
import { Address, parseUnits } from 'viem'
import { useAccount } from 'wagmi'

import { useHemiToken } from './useHemiToken'

export const getIsClaimableQueryKey = ({
  address,
  eligibility,
  hemiId,
}: {
  address: Address
  eligibility: EligibilityData
  hemiId: number
}) => [
  'hemi-token-is-claimable',
  address,
  eligibility.amount,
  hemiId,
  eligibility.claimGroupId,
  ...eligibility.proof,
]

/**
 * Checks if the user can claim given eligibility data. Note that if it returns false,
 * it means either the user already claimed, or that they were not eligible (for example, the proof is invalid).
 * @param eligibility
 */
export const useIsClaimable = function (eligibility: EligibilityData) {
  const { address } = useAccount()
  const hemiToken = useHemiToken()
  const hemiPublicClient = useHemiClient()
  const hemi = useHemi()

  const amount = parseUnits(eligibility.amount, hemiToken.decimals)

  return useQuery({
    enabled: !!address && !!hemiPublicClient,
    queryFn: () =>
      checkIsClaimable({
        account: address!,
        amount,
        chainId: hemi.id,
        client: hemiPublicClient,
        eligibility,
      }),
    queryKey: getIsClaimableQueryKey({
      address,
      eligibility,
      hemiId: hemi.id,
    }),
  })
}
