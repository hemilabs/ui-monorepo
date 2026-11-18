import { Badge } from 'components/badge'
import { CompositionIcon } from 'components/icons/compositionIcon'
import { StatBadgeSkeleton } from 'components/statBadgeSkeleton'
import { StatCard } from 'components/statCard'
import { useFormat } from 'hooks/useFormat'
import { useTranslations } from 'use-intl'
import { isDataUnavailable } from 'utils/queryStatus'

import { type StakeStats } from '../_fetchers/fetchStakeStats'
import { useStakeStats } from '../_hooks/useStakeStats'
const selectLockup = (stats: StakeStats) => ({
  averageLock: stats.averageLock,
  locksCount: stats.locksCount,
})

export const AverageLockup = function () {
  const { formatAverageLockDuration } = useFormat()
  const t = useTranslations('hemi-stake.stats')
  const { data, fetchStatus, isPending, status } = useStakeStats(selectLockup)

  const isUnavailable =
    isDataUnavailable({ fetchStatus, status }) ||
    (data !== undefined && data.averageLock === undefined)

  return (
    <StatCard
      badge={
        isPending && !isUnavailable ? (
          <StatBadgeSkeleton size="medium" />
        ) : data?.locksCount === undefined ? undefined : (
          <Badge size="small" variant="secondary">
            {t('average-lockup-badge', { count: data.locksCount })}
          </Badge>
        )
      }
      icon={<CompositionIcon />}
      isError={isUnavailable}
      isLoading={isPending && !isUnavailable}
      label={t('average-lockup')}
      value={formatAverageLockDuration(data?.averageLock ?? 0)}
    />
  )
}
