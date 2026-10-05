import { Card } from 'components/card'
import {
  SegmentedControl,
  type SegmentedControlOption,
} from 'components/segmentedControl'
import { useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { type EvmToken } from 'types/token'
import { useTranslations } from 'use-intl'
import { type Address } from 'viem'

import { HistoricalMetricsIcon } from '../../../../_icons/historicalMetricsIcon'
import { type MetricPeriod, type MetricType } from '../../../../types'
import { useHistoricalMetrics } from '../../_hooks/useHistoricalMetrics'

import { HeadlineValue } from './headlineValue'
import { HistoricalMetricsChart } from './historicalMetricsChart'

type Props = {
  peggedToken: EvmToken
  shareToken: EvmToken
  stakingVault: Address
}

export const HistoricalMetrics = function ({
  peggedToken,
  shareToken,
  stakingVault,
}: Props) {
  const t = useTranslations('hemi-earn.pool.historical-metrics')
  const [period, setPeriod] = useState<MetricPeriod>('1w')
  const [metricType, setMetricType] = useState<MetricType>('deposits')

  const { data, isError, isPending } = useHistoricalMetrics({
    metricType,
    peggedToken,
    period,
    shareToken,
    stakingVault,
  })

  const periodOptions: SegmentedControlOption<MetricPeriod>[] = [
    { label: t('1-week'), value: '1w' },
    { label: t('month', { count: 1 }), value: '1m' },
    { label: t('month', { count: 3 }), value: '3m' },
    { label: t('1-year'), value: '1y' },
  ]
  const metricTypeOptions: SegmentedControlOption<MetricType>[] = [
    { label: t('pool-deposits'), value: 'deposits' },
    { label: t('apy'), value: 'apy' },
  ]

  const renderHeadline = function () {
    if (isPending) {
      return <Skeleton className="h-7 w-28" />
    }
    const lastValue =
      data && data.length > 0 ? data[data.length - 1].y : undefined
    if (isError || lastValue === undefined) {
      return '-'
    }
    return (
      <HeadlineValue
        metricType={metricType}
        peggedToken={peggedToken}
        value={lastValue}
      />
    )
  }

  return (
    <Card shadow="sm">
      <div className="w-full p-4">
        <div className="flex items-center justify-between">
          <span className="body-text-medium text-neutral-500">
            {t('title')}
          </span>
          <HistoricalMetricsIcon />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <h2 className="shrink-0 text-2xl font-semibold leading-8 -tracking-[0.48px] text-neutral-950">
            {renderHeadline()}
          </h2>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 lg:flex">
              <SegmentedControl
                label={t('period')}
                onChange={setPeriod}
                options={periodOptions}
                value={period}
              />
              <div className="h-3 w-0.5 bg-neutral-200" />
            </div>
            <SegmentedControl
              label={t('metric')}
              onChange={setMetricType}
              options={metricTypeOptions}
              value={metricType}
            />
          </div>
        </div>
        <div className="mt-8">
          <HistoricalMetricsChart
            data={data}
            isError={isError}
            isPending={isPending}
            metricType={metricType}
            peggedToken={peggedToken}
            period={period}
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
