import { Card } from 'components/card'
import {
  SegmentedControl,
  type SegmentedControlOption,
} from 'components/segmentedControl'
import { useState } from 'react'
import { useTranslations } from 'use-intl'
import { isDataUnavailable } from 'utils/queryStatus'

import { useRewardsSeries } from '../_hooks/useRewardsSeries'
import { type RewardsPeriod } from '../_utils/rewardsHistory'

import { RewardsChart } from './rewardsChart'

export const RewardsChartCard = function () {
  const t = useTranslations('hemi-stake.analytics')
  const [period, setPeriod] = useState<RewardsPeriod>('1m')
  const {
    data: series,
    fetchStatus,
    isPending,
    refetch,
    status,
  } = useRewardsSeries(period)

  const isUnavailable = isDataUnavailable({ fetchStatus, status })

  const periodOptions: SegmentedControlOption<RewardsPeriod>[] = [
    { label: t('month', { count: 1 }), value: '1m' },
    { label: t('month', { count: 3 }), value: '3m' },
    { label: t('month', { count: 6 }), value: '6m' },
    { label: t('1-year'), value: '1y' },
  ]

  return (
    <Card shadow="sm">
      <div className="w-full p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="body-text-medium text-neutral-500">
            {t('rewards-title')}
          </span>
          <div className="hidden lg:block">
            <SegmentedControl
              label={t('period')}
              onChange={setPeriod}
              options={periodOptions}
              value={period}
            />
          </div>
        </div>
        <div className="mt-6">
          <RewardsChart
            isPending={isPending && !isUnavailable}
            onRetry={() => refetch()}
            series={series}
          />
        </div>
        <div className="mt-6 lg:hidden">
          <SegmentedControl
            fullWidth
            label={t('period')}
            onChange={setPeriod}
            options={periodOptions}
            value={period}
          />
        </div>
      </div>
    </Card>
  )
}
