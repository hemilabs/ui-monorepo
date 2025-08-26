import { LockupMonths } from 'genesis-drop-actions'
import { useTranslations } from 'next-intl'
import { FormEvent, ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'

import { useClaimGroupConfiguration } from '../_hooks/useClaimGroupConfiguration'
import { useHemiToken } from '../_hooks/useHemiToken'
import { RecommendationLevel } from '../_types'
import { calculateSplitAmount, formatHemi } from '../_utils'
import '../styles.css'

import { Amount } from './amount'
import { Blur } from './blur'
import { FullBonus, SimpleBonus } from './bonusDetails'
import { RecommendedBadge } from './recommendedBadge'

// I prefer to sort these in priority-based order
/* eslint-disable sort-keys */
const boxShadows: Record<RecommendationLevel, string> = {
  low: 'shadow-claim-page-soft',
  medium: 'shadow-claim-page-high',
  high: 'shadow-claim-page-high',
}
/* eslint-enable sort-keys */

const Description = function ({
  recommendationLevel,
}: {
  recommendationLevel: RecommendationLevel
}) {
  const { symbol } = useHemiToken()
  const t = useTranslations('genesis-drop.claim-options')
  return (
    <span
      className={`text-xs font-medium ${
        recommendationLevel === 'high' ? 'text-sky-950' : 'text-neutral-500'
      }`}
    >
      {`/ ${t('tokens-available-now', { symbol })}`}
    </span>
  )
}

type Props = {
  amount: bigint
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
  const t = useTranslations('genesis-drop.claim-options')

  const handleSubmit = function (e: FormEvent) {
    e.preventDefault()
    onSubmit(lockupMonths)
  }

  const renderUnlockedAmount = function () {
    if (isLoadingBonus) {
      return <Skeleton className="h-8 w-32" />
    }
    const { bonus: bonusPercentage, lockupRatio } = data

    const { unlocked } = calculateSplitAmount({
      amount,
      bonusPercentage,
      lockupRatio,
    })

    const formattedValue = formatHemi(unlocked, hemiToken.decimals)

    return (
      <Amount
        recommendationLevel={recommendationLevel}
        value={formattedValue}
      />
    )
  }

  const renderStakedAmount = function (skeleton: ReactNode) {
    if (isLoadingBonus) {
      return <>{skeleton}</>
    }

    const { bonus: bonusPercentage, lockupRatio } = data

    const { staked } = calculateSplitAmount({
      amount,
      bonusPercentage,
      lockupRatio,
    })

    const formattedValue = formatHemi(staked, hemiToken.decimals)

    return <>{formattedValue}</>
  }

  const renderBonus = function () {
    if (isLoadingBonus) {
      return <Skeleton className="h-3 w-10" />
    }
    const { bonus: bonusPercentage } = data

    return <>{bonusPercentage}</>
  }

  return (
    <form
      className={`sm:w-86 max-sm:max-w-90 relative w-full max-w-full rounded-lg bg-neutral-100 ${boxShadows[recommendationLevel]}`}
      onSubmit={handleSubmit}
    >
      <div
        className={`flex flex-col justify-between gap-y-3 rounded-t-lg border-t border-solid border-neutral-300/55 pt-6 ${bgColor}`}
      >
        <div className="flex items-center justify-between px-6">
          <h4 className="text-smd font-semibold text-black">{heading}</h4>
          {recommendationLevel === 'high' && <RecommendedBadge />}
        </div>
        <div className="mt-7 flex items-center gap-x-2 px-6">
          {renderUnlockedAmount()}
          <Description recommendationLevel={recommendationLevel} />
        </div>
        <p className="text-shimmer w-full px-6 text-base font-medium">
          {t.rich('plus-staked-tokens', {
            amount: () => renderStakedAmount(<Skeleton className="h-6 w-14" />),
            break: () => <br />,
            period: () => (
              <span className="lowercase">
                {t('lockup-period-months', { months: lockupMonths })}
              </span>
            ),
          })}
        </p>
        <div className="h-15 flex items-center justify-center border-y border-solid border-t-neutral-300/55 px-6 [&>button]:w-full">
          {submitButton}
        </div>
      </div>
      <div className="md:h-47 h-fit rounded-b-lg">
        {recommendationLevel === 'low' ? (
          <SimpleBonus
            amount={renderStakedAmount(<Skeleton className="h-3 w-10" />)}
            lockupMonths={lockupMonths}
          />
        ) : (
          <FullBonus
            amount={renderStakedAmount(<Skeleton className="h-3 w-10" />)}
            bonus={renderBonus()}
            lockupMonths={lockupMonths}
          />
        )}
      </div>
      {recommendationLevel === 'high' && <Blur />}
    </form>
  )
}
