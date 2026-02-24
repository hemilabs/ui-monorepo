import {
  getUnlockInfo,
  predictVotingPower,
} from 'app/[locale]/staking-dashboard/_utils/lockCreationTimes'
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

  it('should round unlock time down to nearest SIX_DAYS boundary matching the contract', function () {
    // Real on-chain values: start = 1756428611, lockTime = 15778800
    // Contract computes: unlockTime = ((1756428611 + 15778800) / 525960) * 525960 = 1771959240
    const result = getUnlockInfo({ lockTime: 15778800, timestamp: 1756428611 })
    expect(result.unlockTime).toBe(1771959240)
  })

  it('should not round when sum is already on a SIX_DAYS boundary', function () {
    // 525960 * 3370 = 1772484200 is exactly on boundary
    const exactBoundary = 525960 * 3370
    const timestamp = 1000000
    const lockTime = exactBoundary - timestamp

    const result = getUnlockInfo({ lockTime, timestamp })
    expect(result.unlockTime).toBe(exactBoundary)
  })

  it('should compute correct time remaining', function () {
    const result = getUnlockInfo({ lockTime: 15778800, timestamp: 1756428611 })
    // unlockTime (1771959240) - mockNow (1756500000) = 15459240
    expect(result.timeRemainingSeconds).toBe(1771959240 - Number(mockNow))
  })
})

describe('predictVotingPower', function () {
  const mockNow = BigInt(1700000000) // fixed timestamp for testing

  beforeEach(function () {
    vi.useFakeTimers()
    vi.setSystemTime(Number(mockNow) * 1000) // Date.now() returns milliseconds
  })

  afterEach(function () {
    vi.useRealTimers()
  })

  it('should calculate voting power for active position', function () {
    const amount = BigInt(1000e18) // 1000 tokens
    const lockTime = BigInt(365 * 24 * 60 * 60) // 1 year in seconds
    const timestamp = mockNow - BigInt(100) // started 100 seconds ago

    const result = predictVotingPower({ amount, lockTime, timestamp })

    // timeRemaining = (timestamp + lockTime) - now = (mockNow - 100 + 1 year) - mockNow = 1 year - 100 seconds
    // votingPower = (amount * timeRemaining) / maxTimeSeconds
    const maxTimeSeconds = BigInt(4 * 365.25 * 24 * 60 * 60) // 4 years
    const timeRemaining = lockTime - BigInt(100)
    const expectedVotingPower = (amount * timeRemaining) / maxTimeSeconds

    expect(result).toBe(expectedVotingPower)
  })

  it('should return 0 for expired position', function () {
    const amount = BigInt(1000e18)
    const lockTime = BigInt(100) // 100 seconds
    const timestamp = mockNow - BigInt(200) // started 200 seconds ago, already expired

    const result = predictVotingPower({ amount, lockTime, timestamp })

    expect(result).toBe(BigInt(0))
  })

  it('should return 0 when amount is 0', function () {
    const amount = BigInt(0)
    const lockTime = BigInt(365 * 24 * 60 * 60)
    const timestamp = mockNow

    const result = predictVotingPower({ amount, lockTime, timestamp })

    expect(result).toBe(BigInt(0))
  })

  it('should return max voting power for 4 year lock at start', function () {
    const amount = BigInt(1000e18)
    const maxTimeSeconds = BigInt(4 * 365.25 * 24 * 60 * 60)
    const lockTime = maxTimeSeconds
    const timestamp = mockNow // just started

    const result = predictVotingPower({ amount, lockTime, timestamp })

    // At start of 4 year lock, voting power should equal amount
    expect(result).toBe(amount)
  })

  it('should return ~50% voting power for 2 year lock at start', function () {
    const amount = BigInt(1000e18)
    const maxTimeSeconds = BigInt(4 * 365.25 * 24 * 60 * 60)
    const twoYears = maxTimeSeconds / BigInt(2)
    const lockTime = twoYears
    const timestamp = mockNow

    const result = predictVotingPower({ amount, lockTime, timestamp })

    // 2 year lock = 50% of max, so voting power should be ~50% of amount
    const expectedVotingPower = (amount * twoYears) / maxTimeSeconds
    expect(result).toBe(expectedVotingPower)
  })
})
