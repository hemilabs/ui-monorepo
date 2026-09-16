import { Card } from 'components/card'
import { SegmentedControlItem } from 'components/segmentedControlItem'
import { useTranslations } from 'use-intl'
import { isDataUnavailable } from 'utils/queryStatus'

import { useSupplySeries } from '../_hooks/useSupplyStat'
import { type SupplyPeriod, type SupplyUnit } from '../_utils/supplyHistory'

import { SupplyChart } from './supplyChart'

const periods: SupplyPeriod[] = ['1w', '1m', '3m']

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
    status,
  } = useSupplySeries({ period, unit })

  const isUnavailable = isDataUnavailable({ fetchStatus, status })

  const periodLabels: Record<SupplyPeriod, string> = {
    '1m': t('month', { count: 1 }),
    '1w': t('1-week'),
    '3m': t('month', { count: 3 }),
  }

  const periodControls = (className: string) =>
    periods.map(option => (
      <SegmentedControlItem
        className={className}
        key={option}
        onClick={() => onPeriodChange(option)}
        selected={period === option}
      >
        {periodLabels[option]}
      </SegmentedControlItem>
    ))

  return (
    <Card shadow="sm">
      <div className="w-full p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="body-text-medium text-neutral-500">
            {t('title')}
          </span>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 lg:flex">
              {periodControls('')}
            </div>
            <div className="hidden h-3 w-0.5 bg-neutral-200 lg:block" />
            <div className="flex items-center gap-2">
              <SegmentedControlItem
                onClick={() => onUnitChange('hemi')}
                selected={unit === 'hemi'}
              >
                {symbol}
              </SegmentedControlItem>
              <SegmentedControlItem
                onClick={() => onUnitChange('usd')}
                selected={unit === 'usd'}
              >
                USD
              </SegmentedControlItem>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <SupplyChart
            isError={isUnavailable && series === undefined}
            isPending={isPending && !isUnavailable}
            period={period}
            series={series}
            symbol={symbol}
            unit={unit}
          />
        </div>
        <div className="mt-6 flex items-center gap-2 lg:hidden">
          {periodControls('flex-1')}
        </div>
      </div>
    </Card>
  )
}
