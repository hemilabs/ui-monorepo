import { DurationTime } from 'components/durationTime'
import { useHemi } from 'hooks/useHemi'
import Skeleton from 'react-loading-skeleton'
import { StakingPositionStatus } from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'
import { formatNumber } from 'utils/format'
import {
  isAprSupported,
  isRewardsSeriesConfigured,
} from 'utils/veHemiEpochRewards'

import { useCalculateApr } from '../../_hooks/useCalculateApr'
import { useRewardsPerVeHEMI } from '../../_hooks/useRewardsPerVeHEMI'

type Props = {
  lockupTime: bigint
  status: StakingPositionStatus
  tokenId: bigint
}

export const LockupTime = function ({ lockupTime, status, tokenId }: Props) {
  const t = useTranslations('staking-dashboard.table')
  const { id: chainId } = useHemi()
  const seconds = Number(lockupTime)
  const isActive = status === 'active'
  // The same predicate the query is gated on, so they can't drift.
  const showApr = isAprSupported(chainId)

  const { data: apr, status: aprStatus } = useCalculateApr({
    enabled: isActive && showApr,
    tokenId,
  })
  // The APR query is disabled until this one answers, and by status alone a disabled
  // query looks identical to a dead one. Read here as its own query - react-query dedupes
  // it against the one inside `useCalculateApr` - to tell a first load from a dead end.
  const { status: seriesStatus } = useRewardsPerVeHEMI()

  // Data, then unavailable, then loading - the order CLAUDE.md prescribes. Unavailable
  // is decided from reasons rather than from the query being idle: a query waiting on its
  // prerequisite is still loading, and painting it "-" denies an APR that is coming.
  const isUnavailable =
    aprStatus === 'error' ||
    seriesStatus === 'error' ||
    // Nothing further is coming for these two: a withdrawn lock never accrues again, and
    // an unset portal-api URL keeps the series query off for the life of the page. A
    // relative URL is fine - the browser resolves it against the page origin.
    !isActive ||
    !isRewardsSeriesConfigured()

  const renderApr = function () {
    if (!showApr) {
      return null
    }
    if (apr !== undefined) {
      return (
        <span className="body-text-caption text-emerald-600">
          {t('apr', { percentage: formatNumber(apr) })}
        </span>
      )
    }
    if (isUnavailable) {
      return <span className="body-text-caption text-neutral-500">-</span>
    }
    return <Skeleton className="h-4 w-16" />
  }

  return (
    <div className="flex flex-col">
      <span className="text-neutral-950">
        <DurationTime seconds={seconds} />
      </span>
      {renderApr()}
    </div>
  )
}
