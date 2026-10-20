import { maxDays, minDays, step } from './lockCreationTimes'

export type NearestValidValues = {
  maxValue: number | null | undefined
  minValue: number | null | undefined
} | null

type GetNearestValidValuesProps = {
  minLocked?: number
  value: number
}

export const getNearestValidValues = function ({
  minLocked,
  value,
}: GetNearestValidValuesProps): NearestValidValues {
  if (Number.isNaN(value)) {
    return null
  }

  if (minLocked && value < minLocked) {
    return { maxValue: null, minValue: minLocked }
  }

  if (value >= maxDays) return { maxValue: maxDays, minValue: null }
  if (value <= minDays) return { maxValue: null, minValue: minDays }

  const lower = Math.floor((value - minDays) / step) * step + minDays

  return {
    maxValue: Math.min(lower + step, maxDays),
    minValue: minLocked && lower < minLocked ? null : lower,
  }
}
