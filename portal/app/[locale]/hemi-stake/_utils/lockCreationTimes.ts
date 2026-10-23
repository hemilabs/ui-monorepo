import { StakingPosition } from 'types/stakingDashboard'
import { secondsPerDay, unixNowTimestamp } from 'utils/time'
import {
  MaxLockDurationSeconds,
  MinLockDurationSeconds,
  SixDaysSeconds,
} from 've-hemi-actions'

import { getLockEnd, getWeightAt } from './lockEpochs'

export const minDays = Math.floor(MinLockDurationSeconds / secondsPerDay)
export const maxDays = Math.floor(MaxLockDurationSeconds / secondsPerDay)
export const maxYears = Math.round(
  MaxLockDurationSeconds / (365.25 * secondsPerDay),
)
export const step = 6

export const twoYears = 732

// Slider steps, not reward epochs: 61 × 6 days = 366 days. A reward epoch is 6.0875 days.
const sixDayStepsPerYear = 61

export const oneYear = sixDayStepsPerYear * step
export const sixMonths = Math.floor(sixDayStepsPerYear / 2) * step

type GetNearestPresetProps = {
  days: number
  presets: number[]
}

export const getNearestPreset = ({ days, presets }: GetNearestPresetProps) =>
  presets.reduce((closest, preset) =>
    Math.abs(preset - days) < Math.abs(closest - days) ? preset : closest,
  )

// To ensure the lock duration is at least the minimum, we clamp the value after calculation
const clampMin = <T extends number | bigint>(value: T, min: T): T =>
  value < min ? min : value

export function daysToSeconds(days: number): number
export function daysToSeconds(days: bigint): bigint
export function daysToSeconds(days: number | bigint): number | bigint {
  if (typeof days === 'bigint') {
    return clampMin(
      days * BigInt(secondsPerDay),
      BigInt(MinLockDurationSeconds),
    )
  }
  return clampMin(days * secondsPerDay, MinLockDurationSeconds)
}

export const wholeDaysToSeconds = (days: number) =>
  daysToSeconds(BigInt(Math.trunc(days)))

// The contract only accepts an extension whose rounded-down end lands at least one epoch past the current one
export const getExtensionAvailableAt = (lockEnd: number) =>
  lockEnd + SixDaysSeconds - MaxLockDurationSeconds

export const getMinExtensionDays = function ({
  lockEnd,
  now,
}: {
  lockEnd: number
  now: number
}) {
  if (now < getExtensionAvailableAt(lockEnd)) {
    return null
  }
  const minSeconds = lockEnd + SixDaysSeconds - now
  if (minSeconds <= MinLockDurationSeconds) {
    return minDays
  }
  const days = Math.ceil(minSeconds / secondsPerDay)
  return Math.min(minDays + Math.ceil((days - minDays) / step) * step, maxDays)
}

type GetUnlockInfoProps = {
  effectiveLockEnd?: bigint
  lockTime: number | bigint
  timestamp: number | bigint
}

export function getUnlockInfo({
  effectiveLockEnd,
  lockTime,
  timestamp,
}: GetUnlockInfoProps) {
  const currentTimeInSeconds = Number(unixNowTimestamp())

  // Convert to Number for calculations
  const timestampNum = Number(timestamp)
  const lockTimeNum = Number(lockTime)

  const unlockTime = getLockEnd({
    effectiveLockEnd,
    lockTime: lockTimeNum,
    timestamp: timestampNum,
  })
  const timeRemainingSeconds = unlockTime - currentTimeInSeconds

  // Calculate unlock date in UTC
  const unlockDate = new Date(unlockTime * 1000)

  return {
    currentTimeInSeconds,
    timeRemainingSeconds,
    totalLockTimeSeconds: lockTimeNum,
    unlockDate,
    unlockTime,
  }
}

type PredictVotingPowerProps = Pick<
  StakingPosition,
  'amount' | 'lockTime' | 'timestamp'
> &
  Partial<Pick<StakingPosition, 'effectiveLockEnd'>> & { now?: number }

export const predictVotingPower = ({
  amount,
  effectiveLockEnd,
  lockTime,
  now = Number(unixNowTimestamp()),
  timestamp,
}: PredictVotingPowerProps) =>
  getWeightAt({
    amount,
    at: now,
    lockEnd: getLockEnd({
      effectiveLockEnd,
      lockTime: Number(lockTime),
      timestamp: Number(timestamp),
    }),
  })
