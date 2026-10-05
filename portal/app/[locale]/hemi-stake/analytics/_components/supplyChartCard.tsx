import { Card } from 'components/card'
import {
  SegmentedControl,
  type SegmentedControlOption,
} from 'components/segmentedControl'
import { useTranslations } from 'use-intl'
import { isDataUnavailable } from 'utils/queryStatus'

import { useSupplySeries } from '../_hooks/useSupplyStat'
import { type SupplyPeriod, type SupplyUnit } from '../_utils/supplyHistory'

import { SupplyChart } from './supplyChart'

type Props = {
  onPeriodChange: (period: SupplyPeriod) => void
  onUnitChange: (unit: SupplyUnit) => void
  period: SupplyPeriod
  symbol: string
  unit: SupplyUnit
}

export const SupplyChartCard = function ({
  onPeriodChange,
  onUnitChange,
  period,
  symbol,
  unit,
}: Props) {
  const t = useTranslations('hemi-stake.analytics')
  const {
    data: series,
    fetchStatus,
    isPending,
    refetch,
    status,
  } = useSupplySeries({ period, unit })

  const isUnavailable = isDataUnavailable({ fetchStatus, status })

  const periodOptions: SegmentedControlOption<SupplyPeriod>[] = [
    { label: t('1-week'), value: '1w' },
    { label: t('month', { count: 1 }), value: '1m' },
    { label: t('month', { count: 3 }), value: '3m' },
  ]

  return (
    <Card shadow="sm">
      <div className="w-full p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="body-text-medium text-neutral-500">
            {t('title', { symbol })}
          </span>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 lg:flex">
              <SegmentedControl
                label={t('period')}
                onChange={onPeriodChange}
                options={periodOptions}
                value={period}
              />
              <div className="h-3 w-0.5 bg-neutral-200" />
            </div>
            <SegmentedControl
              label={t('unit')}
              onChange={onUnitChange}
              options={[
                { label: symbol, value: 'hemi' },
                { label: 'USD', value: 'usd' },
              ]}
              value={unit}
            />
          </div>
        </div>
        <div className="mt-6">
          <SupplyChart
            isPending={isPending && !isUnavailable}
            onRetry={() => refetch()}
            period={period}
            series={series}
            symbol={symbol}
            unit={unit}
          />
        </div>
        <div className="mt-6 lg:hidden">
          <SegmentedControl
            fullWidth
            label={t('period')}
            onChange={onPeriodChange}
            options={periodOptions}
            value={period}
          />
        </div>
      </div>
    </Card>
  )
}
