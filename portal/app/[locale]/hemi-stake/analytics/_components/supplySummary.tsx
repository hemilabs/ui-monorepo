import {
  supplySlices,
  type SupplyPeriod,
  type SupplyUnit,
} from '../_utils/supplyHistory'

import { SupplySliceCard } from './supplySliceCard'

type Props = {
  period: SupplyPeriod
  symbol: string
  unit: SupplyUnit
}

export const SupplySummary = ({ period, symbol, unit }: Props) => (
  <section className="mt-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 [&>.card-container]:min-w-0">
    {supplySlices.map(slice => (
      <SupplySliceCard
        key={slice}
        period={period}
        slice={slice}
        symbol={symbol}
        unit={unit}
      />
    ))}
  </section>
)
