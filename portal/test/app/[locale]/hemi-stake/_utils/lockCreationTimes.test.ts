import {
  getExtensionAvailableAt,
  getMinExtensionDays,
  getNearestPreset,
  getUnlockInfo,
  predictVotingPower,
  wholeDaysToSeconds,
} from 'app/[locale]/hemi-stake/_utils/lockCreationTimes'
import { getLockEnd } from 'app/[locale]/hemi-stake/_utils/lockEpochs'
import { secondsPerDay } from 'utils/time'
import {
  MaxLockDurationSeconds,
  MinLockDurationSeconds,
  SixDaysSeconds,
} from 've-hemi-actions'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

describe('getUnlockInfo', function () {
  const mockNow = BigInt(1756500000)

  beforeEach(function () {
    vi.useFakeTimers()
    vi.setSystemTime(Number(mockNow) * 1000)
  })

  afterEach(function () {
    vi.useRealTimers()
  })

  it('counts the time left from the unlock time it is given', function () {
    const result = getUnlockInfo({ unlockTime: 1771959240 })

    expect(result.unlockTime).toBe(1771959240)
    expect(result.timeRemainingSeconds).toBe(1771959240 - Number(mockNow))
    expect(result.unlockDate).toEqual(new Date(1771959240 * 1000))
  })

  it('reads the time left off the end it is handed, however it was obtained', function () {
    const result = getUnlockInfo({
      unlockTime: Number(mockNow) + SixDaysSeconds * 3,
    })

    expect(result.timeRemainingSeconds).toBe(SixDaysSeconds * 3)
  })
})

describe('predictVotingPower', function () {
  // The contract stores lock ends on the epoch grid, so a lock that starts on a boundary
  // keeps every second it paid for and the arithmetic below stays exact.
  const mockNow = BigInt(SixDaysSeconds * 3232)
  const maxTimeSeconds = BigInt(MaxLockDurationSeconds)
  const amount = BigInt(1000e18)
  // The contract truncates amount / MAX_TIME once and multiplies after, so no lock is
  // ever worth the full amount.
  const slope = amount / maxTimeSeconds

  it('discards the epoch a lock cannot complete', function () {
    const lockTime = BigInt(SixDaysSeconds * 60)
    const timestamp = mockNow - BigInt(100)

    const result = predictVotingPower({
      amount,
      now: Number(mockNow),
      unlockTime: getLockEnd({
        lockTime: Number(lockTime),
        timestamp: Number(timestamp),
      }),
    })

    // Starting 100 seconds early costs the lock its sixtieth epoch entirely.
    expect(result).toBe(slope * BigInt(SixDaysSeconds * 59))
  })

  it('is worth the effective remainder for an armed position', function () {
    const effectiveLockEnd = BigInt(Number(mockNow) + SixDaysSeconds * 10)

    const result = predictVotingPower({
      amount,
      now: Number(mockNow),
      unlockTime: effectiveLockEnd,
    })

    expect(result).toBe(slope * BigInt(SixDaysSeconds * 10))
  })

  it('is worth nothing for an expired position', function () {
    const result = predictVotingPower({
      amount,
      now: Number(mockNow),
      unlockTime: getLockEnd({
        lockTime: Number(BigInt(100)),
        timestamp: Number(mockNow - BigInt(200)),
      }),
    })

    expect(result).toBe(BigInt(0))
  })

  it('is worth nothing when the amount is 0', function () {
    const result = predictVotingPower({
      amount: BigInt(0),
      now: Number(mockNow),
      unlockTime: getLockEnd({
        lockTime: Number(BigInt(365 * 24 * 60 * 60)),
        timestamp: Number(mockNow),
      }),
    })

    expect(result).toBe(BigInt(0))
  })

  it('is worth all but the truncated remainder for a 4 year lock', function () {
    const result = predictVotingPower({
      amount,
      now: Number(mockNow),
      unlockTime: getLockEnd({
        lockTime: Number(maxTimeSeconds),
        timestamp: Number(mockNow),
      }),
    })

    expect(result).toBe(slope * maxTimeSeconds)
  })

  it('is worth half the amount for a 2 year lock at start', function () {
    const twoYears = maxTimeSeconds / BigInt(2)

    const result = predictVotingPower({
      amount,
      now: Number(mockNow),
      unlockTime: getLockEnd({
        lockTime: Number(twoYears),
        timestamp: Number(mockNow),
      }),
    })

    expect(result).toBe(slope * twoYears)
  })

  it('gives up the part of the final epoch the contract rounds away', function () {
    const result = predictVotingPower({
      amount,
      now: Number(mockNow) + 1,
      unlockTime: getLockEnd({
        lockTime: Number(maxTimeSeconds),
        timestamp: Number(mockNow + BigInt(1)),
      }),
    })

    expect(result).toBeLessThan(amount)
  })

  it('is worth nothing when the lock misses the next epoch boundary', function () {
    const result = predictVotingPower({
      amount,
      now: Number(mockNow) + 1,
      unlockTime: getLockEnd({
        lockTime: Number(BigInt(100)),
        timestamp: Number(mockNow + BigInt(1)),
      }),
    })

    expect(result).toBe(BigInt(0))
  })

  // The lockup form omits `now`, so the default has to keep reading the clock.
  it('falls back to the current time when no instant is given', function () {
    vi.useFakeTimers()
    vi.setSystemTime(Number(mockNow) * 1000)

    const result = predictVotingPower({
      amount,
      unlockTime: getLockEnd({
        lockTime: Number(maxTimeSeconds),
        timestamp: Number(mockNow),
      }),
    })

    vi.useRealTimers()

    expect(result).toBe(slope * maxTimeSeconds)
  })
})

describe('getNearestPreset', function () {
  const presets = [180, 366, 732, 1461]

  it('returns the preset closest to the given value', function () {
    expect(getNearestPreset({ days: 12, presets })).toBe(180)
    expect(getNearestPreset({ days: 400, presets })).toBe(366)
    expect(getNearestPreset({ days: 900, presets })).toBe(732)
    expect(getNearestPreset({ days: 1100, presets })).toBe(1461)
  })

  it('returns the preset itself when the value already is one', function () {
    presets.forEach(preset =>
      expect(getNearestPreset({ days: preset, presets })).toBe(preset),
    )
  })

  it('never returns a value outside the given list', function () {
    expect(getNearestPreset({ days: 1400, presets: [180, 366] })).toBe(366)
  })

  it('prefers the shorter lock when two presets are equally close', function () {
    expect(getNearestPreset({ days: (180 + 366) / 2, presets })).toBe(180)
  })
})

describe('wholeDaysToSeconds', function () {
  it('converts a whole number of days', function () {
    expect(wholeDaysToSeconds(366)).toBe(BigInt(366 * 86_400))
  })

  it('drops the fraction of a day the input carries', function () {
    expect(wholeDaysToSeconds(366.75)).toBe(wholeDaysToSeconds(366))
  })

  it('takes a pasted decimal without throwing', function () {
    expect(() => wholeDaysToSeconds(12.5)).not.toThrow()
  })

  it('clamps to the shortest lock the contract takes', function () {
    expect(wholeDaysToSeconds(1)).toBe(BigInt(MinLockDurationSeconds))
  })
})

describe('getMinExtensionDays', function () {
  const lockEnd = 3423 * SixDaysSeconds
  // Picks the moment at which reaching the next epoch takes exactly `minSeconds`
  const nowFor = (minSeconds: number) => lockEnd + SixDaysSeconds - minSeconds

  it('returns null when the lock already ends at the max for the current epoch', function () {
    const now = lockEnd - MaxLockDurationSeconds + 1
    expect(getMinExtensionDays({ lockEnd, now })).toBeNull()
  })

  it('returns null when the next epoch is beyond the max lock duration', function () {
    expect(
      getMinExtensionDays({ lockEnd, now: nowFor(MaxLockDurationSeconds + 1) }),
    ).toBeNull()
  })

  it('returns the max days when the next epoch is reachable only with the max lock duration', function () {
    expect(
      getMinExtensionDays({ lockEnd, now: nowFor(MaxLockDurationSeconds) }),
    ).toBe(1461)
  })

  it('caps the step at the max days', function () {
    expect(
      getMinExtensionDays({ lockEnd, now: nowFor(1459 * secondsPerDay) }),
    ).toBe(1461)
  })

  it('returns the step that reaches the next epoch exactly', function () {
    expect(
      getMinExtensionDays({ lockEnd, now: nowFor(102 * secondsPerDay) }),
    ).toBe(102)
  })

  it('rounds up to the next step when a day is not enough', function () {
    expect(
      getMinExtensionDays({ lockEnd, now: nowFor(102 * secondsPerDay + 1) }),
    ).toBe(108)
  })

  it('returns the min days while the min lock duration reaches the next epoch', function () {
    expect(
      getMinExtensionDays({ lockEnd, now: nowFor(MinLockDurationSeconds) }),
    ).toBe(12)
  })

  it('returns the next step once the min lock duration is not enough', function () {
    expect(
      getMinExtensionDays({ lockEnd, now: nowFor(MinLockDurationSeconds + 1) }),
    ).toBe(18)
  })
})

describe('getExtensionAvailableAt', function () {
  const lockEnd = 3423 * SixDaysSeconds

  it('returns the first moment the lock can be extended', function () {
    const availableAt = getExtensionAvailableAt(lockEnd)
    expect(getMinExtensionDays({ lockEnd, now: availableAt - 1 })).toBeNull()
    expect(getMinExtensionDays({ lockEnd, now: availableAt })).toBe(1461)
  })
})
