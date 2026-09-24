import { useCallback } from 'react'

import {
  getSupplySummary,
  toChartSeries,
  type ParsedSupplyPoint,
  type SupplyPeriod,
  type SupplySlice,
  type SupplyUnit,
} from '../_utils/supplyHistory'

import { useHemiSupplyHistory } from './useHemiSupplyHistory'

export const useSupplySlice = ({
  period,
  slice,
  unit,
}: {
  period: SupplyPeriod
  slice: SupplySlice
  unit: SupplyUnit
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
  unit: SupplyUnit
}) =>
  useHemiSupplyHistory({
    period,
    select: useCallback(
      (points: ParsedSupplyPoint[]) => toChartSeries({ points, unit }),
      [unit],
    ),
  })
