import { MaxLockDurationSeconds, MinLockDurationSeconds } from 've-hemi-actions'

const daySeconds = 86_400

export const minDays = Math.floor(MinLockDurationSeconds / daySeconds)
export const maxDays = Math.floor(MaxLockDurationSeconds / daySeconds)
export const step = 6

export const halfDays = 732 // 2 years, with a step up to 6 days

export const daysToSeconds = (days: number): bigint =>
  BigInt(days) * BigInt(daySeconds)

export const daysToSecondsNumber = (days: number): number => days * daySeconds
