import { useCallback } from 'react'

import {
  getSupplySummary,
  sliceByPeriod,
  toChartSeries,
  type ParsedSupplyPoint,
  type SupplyPeriod,
  type SupplySlice,
  type SupplyUnit,
} from '../_utils/supplyHistory'

import { useHemiSupplyHistory } from './useHemiSupplyHistory'

const summaryOf = (
  points: ParsedSupplyPoint[],
  period: SupplyPeriod,
  unit: SupplyUnit,
) => getSupplySummary({ points: sliceByPeriod(points, period), unit })

export const useSupplySlice = ({
  period,
  slice,
  unit,
}: {
  period: SupplyPeriod
  slice: SupplySlice
  unit: SupplyUnit
}) =>
  useHemiSupplyHistory(
    useCallback(
      (points: ParsedSupplyPoint[]) => summaryOf(points, period, unit)?.[slice],
      [period, slice, unit],
    ),
  )

export const useSupplyPrice = ({ period }: { period: SupplyPeriod }) =>
  useHemiSupplyHistory(
    useCallback(
      (points: ParsedSupplyPoint[]) => summaryOf(points, period, 'hemi')?.price,
      [period],
    ),
  )

export const useSupplySeries = ({
  period,
  unit,
}: {
  period: SupplyPeriod
  unit: SupplyUnit
}) =>
  useHemiSupplyHistory(
    useCallback(
      (points: ParsedSupplyPoint[]) =>
        toChartSeries({ points: sliceByPeriod(points, period), unit }),
      [period, unit],
    ),
  )
