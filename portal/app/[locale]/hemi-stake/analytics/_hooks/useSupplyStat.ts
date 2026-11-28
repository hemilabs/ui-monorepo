import { useCallback } from 'react'

import { type ChartUnit } from '../../_utils/chartUnit'
import {
  getSupplySummary,
  toChartSeries,
  type ParsedSupplyPoint,
  type SupplyPeriod,
  type SupplySlice,
} from '../_utils/supplyHistory'

import { useHemiSupplyHistory } from './useHemiSupplyHistory'

export const useSupplySlice = ({
  period,
  slice,
  unit,
}: {
  period: SupplyPeriod
  slice: SupplySlice
  unit: ChartUnit
}) =>
  useHemiSupplyHistory({
    period,
    select: useCallback(
      (points: ParsedSupplyPoint[]) =>
        getSupplySummary({ points, unit })?.[slice],
      [slice, unit],
    ),
  })

export const useSupplySeries = ({
  period,
  unit,
}: {
  period: SupplyPeriod
  unit: ChartUnit
}) =>
  useHemiSupplyHistory({
    period,
    select: useCallback(
      (points: ParsedSupplyPoint[]) => toChartSeries({ points, unit }),
      [unit],
    ),
  })
