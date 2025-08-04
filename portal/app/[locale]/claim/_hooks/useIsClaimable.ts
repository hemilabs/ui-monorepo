import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { EligibilityData } from 'tge-claim'
import { checkIsClaimable } from 'tge-claim/actions'
import { Address, parseUnits } from 'viem'
import { useAccount, useWalletClient } from 'wagmi'

import { useHemiToken } from './useHemiToken'

const getIsClaimableQueryKey = ({
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
  const { data: walletClient } = useWalletClient()
  const hemi = useHemi()

  const amount = parseUnits(eligibility.amount, hemiToken.decimals)

  return useQuery({
    enabled: !!address && !!walletClient,
    queryFn: () =>
      checkIsClaimable({
        account: address!,
        amount,
        chainId: hemi.id,
        eligibility,
        walletClient: walletClient!,
      }),
    queryKey: getIsClaimableQueryKey({
      address,
      eligibility,
      hemiId: hemi.id,
    }),
  })
}
