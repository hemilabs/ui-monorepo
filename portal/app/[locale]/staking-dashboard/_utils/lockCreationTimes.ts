import { MaxLockDurationSeconds, MinLockDurationSeconds } from 've-hemi-actions'

const daySeconds = 86_400

export const minDays = Math.floor(MinLockDurationSeconds / daySeconds)
export const maxDays = Math.floor(MaxLockDurationSeconds / daySeconds)
export const step = 6

export const twoYears = 732

// To ensure the lock duration is at least the minimum, we clamp the value after calculation
const clampMin = <T extends number | bigint>(value: T, min: T): T =>
  value < min ? min : value

export function daysToSeconds(days: number): number
export function daysToSeconds(days: bigint): bigint
export function daysToSeconds(days: number | bigint): number | bigint {
  if (typeof days === 'bigint') {
    return clampMin(days * BigInt(daySeconds), BigInt(MinLockDurationSeconds))
  }
  return clampMin(days * daySeconds, MinLockDurationSeconds)
}
