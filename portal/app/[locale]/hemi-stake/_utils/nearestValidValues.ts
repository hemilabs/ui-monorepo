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

  if (value >= maxDays) return { maxValue: maxDays, minValue: null }
  if (value <= minDays) return { maxValue: null, minValue: minDays }

  // Calculate based on minDays
  const base = Math.floor((value - minDays) / step) * step + minDays
  const lower = base
  const upper = Math.min(base + step, maxDays)

  // Filter out values below minLocked
  const validLower = minLocked && lower < minLocked ? null : lower
  const validUpper = minLocked && upper < minLocked ? null : upper

  // If value is below minLocked, only suggest minLocked or higher
  if (minLocked && value < minLocked) {
    return { maxValue: null, minValue: minLocked }
  }

  return {
    maxValue: validUpper,
    minValue: validLower,
  }
}
