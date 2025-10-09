import { StakingPosition } from 'types/stakingDashboard'
import { MaxLockDurationSeconds, MinLockDurationSeconds } from 've-hemi-actions'

export const daySeconds = 86_400

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

type GetUnlockInfoProps = {
  timestamp: number | bigint
  lockTime: number | bigint
}

export function getUnlockInfo({ lockTime, timestamp }: GetUnlockInfoProps) {
  const currentTimeInSeconds = Math.floor(Date.now() / 1000)

  // Convert to Number for calculations
  const timestampNum = Number(timestamp)
  const lockTimeNum = Number(lockTime)

  const unlockTime = timestampNum + lockTimeNum
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

type CalculateVotingPowerProps = Pick<
  StakingPosition,
  'amount' | 'timestamp' | 'lockTime'
>

export function calculateVotingPower({
  amount,
  lockTime,
  timestamp,
}: CalculateVotingPowerProps) {
  const maxTimeSeconds = BigInt(maxDays * daySeconds)
  const now = BigInt(Math.floor(Date.now() / 1000))

  const end = timestamp + lockTime
  const timeRemaining = end > now ? end - now : BigInt(0)

  // Calculate voting power (decays linearly)
  const votingPower = (amount * timeRemaining) / maxTimeSeconds

  // Calculate percentage: (votingPower / lockedAmount) * 100
  const percentageOfMax =
    amount > BigInt(0)
      ? Math.min(100, Number((votingPower * BigInt(10000)) / amount) / 100)
      : 0

  return {
    percentageOfMax,
    votingPower,
  }
}
