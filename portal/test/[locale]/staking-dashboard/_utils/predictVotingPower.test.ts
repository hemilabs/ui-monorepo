import { predictVotingPower } from 'app/[locale]/staking-dashboard/_utils/lockCreationTimes'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

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
