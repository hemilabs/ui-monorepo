import { maxDays, minDays, step } from './lockCreationTimes'

export type NearestValidValues = {
  maxValue: number | null
  minValue: number | null
} | null

type Props = {
  minLocked?: number
  value: number
}

export const getNearestValidValues = function ({
  minLocked,
  value,
}: Props): NearestValidValues {
  if (Number.isNaN(value)) {
    return null
  }

  if (value >= maxDays) return { maxValue: maxDays, minValue: null }
  if (value <= minDays) return { maxValue: null, minValue: minDays }

  const base = Math.floor((value - minDays) / step) * step + minDays
  const lower = base
  const upper = Math.min(base + step, maxDays)

  const validLower = minLocked && lower < minLocked ? null : lower
  const validUpper = minLocked && upper < minLocked ? null : upper

  if (minLocked && value < minLocked) {
    return { maxValue: null, minValue: minLocked }
  }

  return {
    maxValue: validUpper,
    minValue: validLower,
  }
}
