import {
  getNearestPreset,
  getUnlockInfo,
  predictVotingPower,
} from 'app/[locale]/hemi-stake/_utils/lockCreationTimes'
import { MaxLockDurationSeconds, SixDaysSeconds } from 've-hemi-actions'
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

  it('rounds unlock time down to nearest SIX_DAYS boundary matching the contract', function () {
    // Real on-chain values: start = 1756428611, lockTime = 15778800
    // Contract computes: unlockTime = ((1756428611 + 15778800) / 525960) * 525960 = 1771959240
    const result = getUnlockInfo({ lockTime: 15778800, timestamp: 1756428611 })
    expect(result.unlockTime).toBe(1771959240)
  })

  it('does not round when sum is already on a SIX_DAYS boundary', function () {
    // 525960 * 3370 = 1772484200 is exactly on boundary
    const exactBoundary = 525960 * 3370
    const timestamp = 1000000
    const lockTime = exactBoundary - timestamp

    const result = getUnlockInfo({ lockTime, timestamp })
    expect(result.unlockTime).toBe(exactBoundary)
  })

  it('computes correct time remaining', function () {
    const result = getUnlockInfo({ lockTime: 15778800, timestamp: 1756428611 })
    // unlockTime (1771959240) - mockNow (1756500000) = 15459240
    expect(result.timeRemainingSeconds).toBe(1771959240 - Number(mockNow))
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
      lockTime,
      now: Number(mockNow),
      timestamp,
    })

    // Starting 100 seconds early costs the lock its sixtieth epoch entirely.
    expect(result).toBe(slope * BigInt(SixDaysSeconds * 59))
  })

  it('is worth nothing for an expired position', function () {
    const result = predictVotingPower({
      amount,
      lockTime: BigInt(100),
      now: Number(mockNow),
      timestamp: mockNow - BigInt(200),
    })

    expect(result).toBe(BigInt(0))
  })

  it('is worth nothing when the amount is 0', function () {
    const result = predictVotingPower({
      amount: BigInt(0),
      lockTime: BigInt(365 * 24 * 60 * 60),
      now: Number(mockNow),
      timestamp: mockNow,
    })

    expect(result).toBe(BigInt(0))
  })

  it('is worth all but the truncated remainder for a 4 year lock', function () {
    const result = predictVotingPower({
      amount,
      lockTime: maxTimeSeconds,
      now: Number(mockNow),
      timestamp: mockNow,
    })

    expect(result).toBe(slope * maxTimeSeconds)
  })

  it('is worth half the amount for a 2 year lock at start', function () {
    const twoYears = maxTimeSeconds / BigInt(2)

    const result = predictVotingPower({
      amount,
      lockTime: twoYears,
      now: Number(mockNow),
      timestamp: mockNow,
    })

    expect(result).toBe(slope * twoYears)
  })

  it('gives up the part of the final epoch the contract rounds away', function () {
    const result = predictVotingPower({
      amount,
      lockTime: maxTimeSeconds,
      now: Number(mockNow) + 1,
      timestamp: mockNow + BigInt(1),
    })

    expect(result).toBeLessThan(amount)
  })

  it('is worth nothing when the lock misses the next epoch boundary', function () {
    const result = predictVotingPower({
      amount,
      lockTime: BigInt(100),
      now: Number(mockNow) + 1,
      timestamp: mockNow + BigInt(1),
    })

    expect(result).toBe(BigInt(0))
  })

  // The lockup form omits `now`, so the default has to keep reading the clock.
  it('falls back to the current time when no instant is given', function () {
    vi.useFakeTimers()
    vi.setSystemTime(Number(mockNow) * 1000)

    const result = predictVotingPower({
      amount,
      lockTime: maxTimeSeconds,
      timestamp: mockNow,
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
