import { InfoIcon } from 'components/icons/infoIcon'
import { Spinner } from 'components/spinner'
import { Tooltip } from 'components/tooltip'
import { type EligibilityData } from 'genesis-drop-actions'
import { useTranslations } from 'next-intl'

import { useGetClaimTransaction } from '../_hooks/useGetClaimTransaction'
import { useHemiToken } from '../_hooks/useHemiToken'
import { useIsClaimable } from '../_hooks/useIsClaimable'
import { formatHemi } from '../_utils'

import { ClaimDetails } from './claimDetails'
import { ClaimOptions } from './claimOptions'
import { ComeBackLater } from './comeBackLater'
import { EligibilityStatus } from './eligibilityStatus'
import { NotEligible } from './notEligible'

type Props = {
  eligibility: EligibilityData
}

const MoreInfo = function () {
  const t = useTranslations('genesis-drop.claim-options')
  return (
    <Tooltip
      borderRadius="12px"
      id="more-info-hemi"
      overlay={
        <p className="p-4 text-sm font-medium text-white">
          {t('more-info-description')}
        </p>
      }
    >
      <div className="group/icon">
        <InfoIcon className="group-hover/icon:[&>g>path]:fill-neutral-950" />
      </div>
    </Tooltip>
  )
}

export const Eligible = function ({ eligibility }: Props) {
  const { data: isClaimable } = useIsClaimable(eligibility)
  const hemiToken = useHemiToken()
  const { data: transaction } = useGetClaimTransaction(eligibility.claimGroupId)
  const t = useTranslations('genesis-drop')

  const amount = formatHemi(eligibility.amount, hemiToken.decimals)
  const claimGroupIdAvailable = eligibility.claimGroupId !== undefined

  if (isClaimable === undefined && claimGroupIdAvailable) {
    return (
      <div className="mt-5">
        <Spinner color="#FF6A00" size="small" />
      </div>
    )
  }

  if (claimGroupIdAvailable && transaction) {
    // User has already claimed. If it could not claim, there wouldn't be a transaction hash,
    // and we wouldn't be here.
    return (
      <>
        <EligibilityStatus status="claimed" />
        <ClaimDetails eligibility={eligibility} />
      </>
    )
  }

  // check for false, because it may be undefined for disabled query
  // during the Claim Checker stage.
  if (isClaimable === false) {
    return <NotEligible />
  }

  const proofAvailable = eligibility.proof.length > 0
  return (
    <>
      <div className="max-h-22 md:max-w-105 w-full max-w-60 sm:max-w-80">
        <EligibilityStatus amount={amount} status="eligible" />
      </div>
      <div className="flex items-center gap-x-1">
        <p className="text-center text-xs font-medium text-neutral-500">
          {t('your-earned-tokens', { symbol: hemiToken.symbol })}
        </p>
        {proofAvailable && <MoreInfo />}
      </div>
      {proofAvailable && claimGroupIdAvailable ? (
        <ClaimOptions eligibility={eligibility} />
      ) : (
        <ComeBackLater />
      )}
    </>
  )
}
