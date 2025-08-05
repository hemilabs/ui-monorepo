import { useTranslations } from 'next-intl'
import { type EligibilityData } from 'tge-claim'

import { useGetClaimTransaction } from '../_hooks/useGetClaimTransaction'
import { useHemiToken } from '../_hooks/useHemiToken'
import { useIsClaimable } from '../_hooks/useIsClaimable'
import { formatHemi } from '../_utils'

import { ClaimDetails } from './claimDetails'
import { ClaimOptions } from './claimOptions'
import { EligibilityStatus } from './eligibilityStatus'
import { NotEligible } from './notEligible'

type Props = {
  eligibility: EligibilityData
}

export const Eligible = function ({ eligibility }: Props) {
  const { data: claimTransaction, isLoading: isGetClaimTransactionLoading } =
    useGetClaimTransaction(eligibility.claimGroupId)
  const { data: isClaimable, isLoading: isClaimableLoading } =
    useIsClaimable(eligibility)
  const hemiToken = useHemiToken()
  const t = useTranslations('rewards-page')

  const amount = formatHemi(BigInt(eligibility.amount), hemiToken.decimals)

  const isLoading = isClaimableLoading || isGetClaimTransactionLoading

  if (isLoading) {
    return <p>...</p>
  }

  if (claimTransaction) {
    // User has already claimed. If it could not claim, there wouldn't be a transaction hash,
    // and we wouldn't be here.
    return (
      <>
        <EligibilityStatus status="claimed" />
        <ClaimDetails eligibility={eligibility} />
      </>
    )
  }

  if (isClaimable) {
    // User is eligible, as they can claim
    return (
      <>
        <div className="max-h-22 w-full max-w-60 sm:max-w-80">
          <EligibilityStatus amount={amount} status="eligible" />
        </div>
        <p className="text-center text-xs font-medium text-neutral-500">
          {t('you-are-eligible')}
        </p>
        <ClaimOptions eligibility={eligibility} />
      </>
    )
  }
  // This should not be reached, as it means "eligibility" was not valid
  // and we're already validating it exists when consuming this component.
  // However, I'm handling it just in case the json has invalid data.
  // If isClaimable returns false, and there is no claimTransaction,
  // it means the user is not eligible.
  return <NotEligible />
}
