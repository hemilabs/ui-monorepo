import { useLocale, useTranslations } from 'use-intl'
import { isDataUnavailable } from 'utils/queryStatus'

import { type StakeStats } from '../_fetchers/fetchStakeStats'
import { useStakeStats } from '../_hooks/useStakeStats'
import { formatAverageLockDuration } from '../_utils/averageLockDuration'

import { StakeStatCard } from './stakeStatCard'
import { StatBadge } from './statBadge'

const selectLockup = (stats: StakeStats) => ({
  averageLock: stats.averageLock,
  locksCount: stats.locksCount,
})

export const AverageLockup = function () {
  const locale = useLocale()
  const t = useTranslations('hemi-stake.stats')
  const { data, fetchStatus, isPending, status } = useStakeStats(selectLockup)

  const isUnavailable =
    isDataUnavailable({ fetchStatus, status }) ||
    (data !== undefined && data.averageLock === undefined)

  return (
    <StakeStatCard
      badge={
        data?.locksCount === undefined ? undefined : (
          <StatBadge>
            {t('average-lockup-badge', { count: data.locksCount })}
          </StatBadge>
        )
      }
      isError={isUnavailable}
      isLoading={isPending && !isUnavailable}
      label={t('average-lockup')}
      value={formatAverageLockDuration(data?.averageLock ?? 0, locale)}
    />
  )
}
