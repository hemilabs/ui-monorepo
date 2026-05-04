'use client'

import { Card } from 'components/card'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { type EvmToken } from 'types/token'
import { type Address } from 'viem'

import { HistoricalMetricsIcon } from '../../../../_icons/historicalMetricsIcon'
import { type MetricPeriod, type MetricType } from '../../../../types'
import { useHistoricalMetrics } from '../../_hooks/useHistoricalMetrics'
import { SegmentedControlItem } from '../segmentedControlItem'

import { HeadlineValue } from './headlineValue'
import { HistoricalMetricsChart } from './historicalMetricsChart'

type Props = {
  token: EvmToken
  vaultAddress: Address
}

export const HistoricalMetrics = function ({ token, vaultAddress }: Props) {
  const t = useTranslations('hemi-earn.vault.historical-metrics')
  const [period, setPeriod] = useState<MetricPeriod>('1w')
  const [metricType, setMetricType] = useState<MetricType>('deposits')

  const { data, isError, isPending } = useHistoricalMetrics({
    metricType,
    period,
    token,
    vaultAddress,
  })

  const lastValue =
    data && data.length > 0 ? data[data.length - 1].y : undefined

  const renderHeadline = function () {
    if (isPending) {
      return <Skeleton className="h-7 w-28" />
    }
    if (isError || lastValue === undefined) {
      return '-'
    }
    return <HeadlineValue metricType={metricType} value={lastValue} />
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
          {/* Desktop: period + metric type toggles inline */}
          <div className="hidden items-center gap-3 lg:flex">
            <div className="flex items-center gap-2">
              <SegmentedControlItem
                onClick={() => setPeriod('1w')}
                selected={period === '1w'}
              >
                {t('1-week')}
              </SegmentedControlItem>
              <SegmentedControlItem
                onClick={() => setPeriod('1m')}
                selected={period === '1m'}
              >
                {t('month', { count: 1 })}
              </SegmentedControlItem>
              <SegmentedControlItem
                onClick={() => setPeriod('3m')}
                selected={period === '3m'}
              >
                {t('month', { count: 3 })}
              </SegmentedControlItem>
              <SegmentedControlItem
                onClick={() => setPeriod('1y')}
                selected={period === '1y'}
              >
                {t('1-year')}
              </SegmentedControlItem>
            </div>
            <div className="h-3 w-0.5 bg-neutral-200" />
            <div className="flex items-center gap-2">
              <SegmentedControlItem
                onClick={() => setMetricType('deposits')}
                selected={metricType === 'deposits'}
              >
                {t('vault-deposits')}
              </SegmentedControlItem>
              <SegmentedControlItem
                onClick={() => setMetricType('apy')}
                selected={metricType === 'apy'}
              >
                {t('apy')}
              </SegmentedControlItem>
            </div>
          </div>
          {/* Mobile: only metric type toggle inline */}
          <div className="flex items-center gap-2 lg:hidden">
            <SegmentedControlItem
              onClick={() => setMetricType('deposits')}
              selected={metricType === 'deposits'}
            >
              {t('vault-deposits')}
            </SegmentedControlItem>
            <SegmentedControlItem
              onClick={() => setMetricType('apy')}
              selected={metricType === 'apy'}
            >
              {t('apy')}
            </SegmentedControlItem>
          </div>
        </div>
        <div className="mt-8">
          <HistoricalMetricsChart
            data={data}
            isError={isError}
            isPending={isPending}
            metricType={metricType}
            period={period}
          />
        </div>
        {/* Mobile: period buttons below chart */}
        <div className="mt-6 flex items-center gap-2 lg:hidden">
          <SegmentedControlItem
            className="flex-1"
            onClick={() => setPeriod('1w')}
            selected={period === '1w'}
          >
            {t('1-week')}
          </SegmentedControlItem>
          <SegmentedControlItem
            className="flex-1"
            onClick={() => setPeriod('1m')}
            selected={period === '1m'}
          >
            {t('month', { count: 1 })}
          </SegmentedControlItem>
          <SegmentedControlItem
            className="flex-1"
            onClick={() => setPeriod('3m')}
            selected={period === '3m'}
          >
            {t('month', { count: 3 })}
          </SegmentedControlItem>
          <SegmentedControlItem
            className="flex-1"
            onClick={() => setPeriod('1y')}
            selected={period === '1y'}
          >
            {t('1-year')}
          </SegmentedControlItem>
        </div>
      </div>
    </Card>
  )
}
