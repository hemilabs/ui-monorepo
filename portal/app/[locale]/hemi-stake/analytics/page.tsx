import { useHemiToken } from 'hooks/useHemiToken'
import { useState } from 'react'

import { StatsSection } from '../_components/statsSection'

import { SupplyChartCard } from './_components/supplyChartCard'
import { SupplySummary } from './_components/supplySummary'
import { type SupplyPeriod, type SupplyUnit } from './_utils/supplyHistory'

export const HemiStakeAnalyticsPage = function () {
  const { symbol } = useHemiToken()
  const [period, setPeriod] = useState<SupplyPeriod>('3m')
  const [unit, setUnit] = useState<SupplyUnit>('usd')

  return (
    <>
      <StatsSection />
      <SupplySummary period={period} symbol={symbol} unit={unit} />
      <div className="mt-6">
        <SupplyChartCard
          onPeriodChange={setPeriod}
          onUnitChange={setUnit}
          period={period}
          symbol={symbol}
          unit={unit}
        />
      </div>
    </>
  )
}
