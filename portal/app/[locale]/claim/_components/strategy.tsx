import { SparklesIcon } from 'components/icons/sparkles'
import { useTranslations } from 'next-intl'
import { FormEvent, ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'
import { LockupMonths } from 'tge-claim'

import { useClaimGroupConfiguration } from '../_hooks/useClaimGroupConfiguration'
import { useHemiToken } from '../_hooks/useHemiToken'
import { RecommendationLevel } from '../_types'
import { formatHemi } from '../_utils'
import '../styles.css'

import { Amount } from './amount'
import { Blur } from './blur'
import { BonusDetails, NoBonus } from './bonusDetails'
import { RecommendedBadge } from './recommendedBadge'
import { StakedHemiTooltip } from './stakedHemiTooltip'

// I prefer to sort these in priority-based order
/* eslint-disable sort-keys */
const boxShadows: Record<RecommendationLevel, string> = {
  low: 'shadow-claim-page-soft',
  medium: 'shadow-claim-page-high',
  high: 'shadow-claim-page-high',
}
/* eslint-enable sort-keys */

const Description = ({
  recommendationLevel,
  text,
}: {
  recommendationLevel: RecommendationLevel
  text: string
}) => (
  <span
    className={`text-xs font-medium ${
      recommendationLevel === 'high' ? 'text-sky-950' : 'text-neutral-500'
    }`}
  >
    {`/ ${text}`}
  </span>
)

type Props = {
  amount: string
  bgColor: string
  claimGroupId: number
  heading: string
  lockupMonths: LockupMonths
  onSubmit: (lockupMonths: LockupMonths) => void
  recommendationLevel: RecommendationLevel
  submitButton: ReactNode
}

export const Strategy = function ({
  amount,
  bgColor,
  claimGroupId,
  heading,
  lockupMonths,
  onSubmit,
  recommendationLevel,
  submitButton,
}: Props) {
  const { data, isLoading: isLoadingBonus } = useClaimGroupConfiguration({
    claimGroupId,
    lockupMonths,
  })
  const hemiToken = useHemiToken()
  const t = useTranslations('rewards-page.claim-options')

  const handleSubmit = function (e: FormEvent) {
    e.preventDefault()
    onSubmit(lockupMonths)
  }

  const renderBonusBadge = function () {
    if (isLoadingBonus) {
      return <Skeleton className="h-4.5 w-30" />
    }
    const { bonus: bonusPercentage } = data
    if (bonusPercentage === 0) {
      return null
    }
    return (
      <div className="flex items-center gap-x-0.5">
        <span className="text-shimmer text-sm font-semibold">
          {t('bonus-hemi', {
            percentage: bonusPercentage,
          })}
        </span>
        <SparklesIcon />
      </div>
    )
  }

  const renderAmount = function (type: 'staked' | 'unlocked') {
    if (isLoadingBonus) {
      return <Skeleton className="h-8 w-32" />
    }
    const { bonus: bonusPercentage, lockupRatio } = data

    // Split the claimable amount in staked and unlocked
    const claimAmount = BigInt(amount)
    // multiply by 100 as decimal numbers don't work with BigInt
    // as it is a percentage, we need to divide by 100, and remove the extra 100 we've added
    const stakedHemi = (claimAmount * BigInt(lockupRatio * 100)) / BigInt(10000)
    const unlockedHemi = claimAmount - stakedHemi

    const value = type === 'staked' ? stakedHemi : unlockedHemi

    // apply the bonus, if any. Similar to lockup, bonus may include decimals.
    const finalValue =
      value + (value * BigInt(bonusPercentage * 100)) / BigInt(10000)

    const formattedValue = formatHemi(finalValue, hemiToken.decimals)

    return (
      <Amount
        recommendationLevel={recommendationLevel}
        value={formattedValue}
      />
    )
  }

  return (
    <form
      className={`sm:w-86 max-sm:max-w-90 relative w-full max-w-full rounded-lg bg-neutral-100 ${boxShadows[recommendationLevel]}`}
      onSubmit={handleSubmit}
    >
      <div className="h-11 w-full rounded-t-lg bg-neutral-100 px-6 pt-2">
        <div className="flex items-center justify-between pt-1">
          <h5 className="text-smd font-semibold text-black">
            {t(`lockup-period-${lockupMonths}`)}
          </h5>
          {renderBonusBadge()}
        </div>
      </div>
      <div
        className={`flex h-52 flex-col justify-between rounded-t-lg border-t border-solid border-neutral-300/55 pt-4 ${bgColor}`}
      >
        <div className="flex items-center justify-between px-6">
          <h4 className="text-smd font-semibold text-black">{heading}</h4>
          {recommendationLevel === 'high' && <RecommendedBadge />}
        </div>
        <div className="mb-2 mt-auto grid grid-cols-[1fr_auto_1fr] grid-rows-2 place-items-center">
          {renderAmount('unlocked')}
          <span
            className={`text-2.33xl ${
              recommendationLevel === 'high' ? 'text-sky-850' : 'text-black'
            }`}
          >
            +
          </span>
          {renderAmount('staked')}
          <Description
            recommendationLevel={recommendationLevel}
            text={t('unlocked-hemi')}
          />
          {/* Empty column for the grid */}
          <div />
          <div className="flex items-center gap-x-1">
            <Description
              recommendationLevel={recommendationLevel}
              text={t('staked-hemi')}
            />
            <StakedHemiTooltip />
          </div>
        </div>
        <div className="h-15 flex items-center justify-center border-y border-solid border-t-neutral-300/55 px-4 [&>button]:w-full">
          {submitButton}
        </div>
      </div>
      <div className="h-24 rounded-b-lg">
        {recommendationLevel === 'low' ? <NoBonus /> : <BonusDetails />}
      </div>
      {recommendationLevel === 'high' && <Blur />}
    </form>
  )
}
