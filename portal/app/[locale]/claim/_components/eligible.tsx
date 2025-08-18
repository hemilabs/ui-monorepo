import { Spinner } from 'components/spinner'
import { useTranslations } from 'next-intl'
import { type EligibilityData } from 'tge-claim'

import { useHemiToken } from '../_hooks/useHemiToken'
import { useIsClaimable } from '../_hooks/useIsClaimable'
import { formatHemi } from '../_utils'

import { ClaimDetails } from './claimDetails'
import { ClaimOptions } from './claimOptions'
import { EligibilityStatus } from './eligibilityStatus'

type Props = {
  eligibility: EligibilityData
}

export const Eligible = function ({ eligibility }: Props) {
  const { data: isClaimable, isLoading: isClaimableLoading } =
    useIsClaimable(eligibility)
  const hemiToken = useHemiToken()
  const t = useTranslations('rewards-page')

  const amount = formatHemi(BigInt(eligibility.amount), hemiToken.decimals)

  if (isClaimableLoading || isClaimable === undefined) {
    return (
      <div className="mt-5">
        <Spinner color="#FF6A00" size="small" />
      </div>
    )
  }

  if (!isClaimable) {
    // User has already claimed. If it could not claim, there wouldn't be a transaction hash,
    // and we wouldn't be here.
    return (
      <>
        <EligibilityStatus status="claimed" />
        <ClaimDetails eligibility={eligibility} />
      </>
    )
  }

  // User is eligible, as they can claim
  return (
    <>
      <div className="max-h-22 w-full max-w-60 sm:max-w-80">
        <EligibilityStatus amount={amount} status="eligible" />
      </div>
      <p className="text-center text-xs font-medium text-neutral-500">
        {t('your-earned-tokens', { symbol: hemiToken.symbol })}
      </p>
      <ClaimOptions eligibility={eligibility} />
    </>
  )
}
