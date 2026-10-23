import { StakingPosition } from 'types/stakingDashboard'
import { secondsPerDay, unixNowTimestamp } from 'utils/time'
import {
  MaxLockDurationSeconds,
  MinLockDurationSeconds,
  SixDaysSeconds,
} from 've-hemi-actions'

import { getWeightAt } from './lockEpochs'

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
  unlockTime: number | bigint
}

export function getUnlockInfo({ unlockTime }: GetUnlockInfoProps) {
  const currentTimeInSeconds = Number(unixNowTimestamp())

  const unlockTimeNum = Number(unlockTime)
  const timeRemainingSeconds = unlockTimeNum - currentTimeInSeconds

  const unlockDate = new Date(unlockTimeNum * 1000)

  return {
    currentTimeInSeconds,
    timeRemainingSeconds,
    unlockDate,
    unlockTime: unlockTimeNum,
  }
}

type PredictVotingPowerProps = Pick<StakingPosition, 'amount'> & {
  now?: number
  unlockTime: number | bigint
}

export const predictVotingPower = ({
  amount,
  now = Number(unixNowTimestamp()),
  unlockTime,
}: PredictVotingPowerProps) =>
  getWeightAt({ amount, at: now, lockEnd: Number(unlockTime) })
