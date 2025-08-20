import { Spinner } from 'components/spinner'
import { useTranslations } from 'next-intl'
import { type EligibilityData } from 'tge-claim'

import { useHemiToken } from '../_hooks/useHemiToken'
import { useIsClaimable } from '../_hooks/useIsClaimable'
import { formatHemi } from '../_utils'

import { ClaimDetails } from './claimDetails'
import { ClaimOptions } from './claimOptions'
import { ComeBackLater } from './comeBackLater'
import { EligibilityStatus } from './eligibilityStatus'

type Props = {
  eligibility: EligibilityData
}

export const Eligible = function ({ eligibility }: Props) {
  const { data: isClaimable } = useIsClaimable(eligibility)
  const hemiToken = useHemiToken()
  const t = useTranslations('rewards-page')

  const amount = formatHemi(BigInt(eligibility.amount), hemiToken.decimals)
  const claimGroupIdAvailable = eligibility.claimGroupId !== undefined

  if (isClaimable === undefined && claimGroupIdAvailable) {
    return (
      <div className="mt-5">
        <Spinner color="#FF6A00" size="small" />
      </div>
    )
  }

  if (claimGroupIdAvailable && !isClaimable) {
    // User has already claimed. If it could not claim, there wouldn't be a transaction hash,
    // and we wouldn't be here.
    return (
      <>
        <EligibilityStatus status="claimed" />
        <ClaimDetails eligibility={eligibility} />
      </>
    )
  }

  const proofAvailable = eligibility.proof.length > 0
  return (
    <>
      <div className="max-h-22 w-full max-w-60 sm:max-w-80">
        <EligibilityStatus amount={amount} status="eligible" />
      </div>
      <p className="text-center text-xs font-medium text-neutral-500">
        {t('your-earned-tokens', { symbol: hemiToken.symbol })}
      </p>
      {proofAvailable && claimGroupIdAvailable ? (
        <ClaimOptions eligibility={eligibility} />
      ) : (
        <ComeBackLater />
      )}
    </>
  )
}
