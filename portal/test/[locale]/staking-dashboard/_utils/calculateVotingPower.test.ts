import {
  calculateVotingPower,
  daySeconds,
  maxDays,
} from 'app/[locale]/staking-dashboard/_utils/lockCreationTimes'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('calculateVotingPower', function () {
  const mockNow = 1000000000 // Fixed timestamp for tests

  beforeEach(function () {
    vi.useFakeTimers()
    vi.setSystemTime(mockNow * 1000)
  })

  afterEach(function () {
    vi.useRealTimers()
  })

  it('should return 100% voting power at lock creation with max duration', function () {
    const amount = BigInt(1000e18) // 1000 HEMI
    const timestamp = BigInt(mockNow)
    const lockTime = BigInt(maxDays * daySeconds)

    const result = calculateVotingPower({ amount, lockTime, timestamp })

    expect(result.votingPower).toBe(amount)
    expect(result.percentageOfMax).toBe(100)
  })

  it('should return 50% voting power at half time remaining', function () {
    const amount = BigInt(1000e18)
    const maxTime = BigInt(maxDays * daySeconds)
    const timestamp = BigInt(mockNow - Number(maxTime) / 2) // Started half time ago
    const lockTime = maxTime

    const result = calculateVotingPower({ amount, lockTime, timestamp })

    expect(result.votingPower).toBe(amount / BigInt(2))
    expect(result.percentageOfMax).toBe(50)
  })

  it('should return 0% voting power after lock expires', function () {
    const amount = BigInt(1000e18)
    const timestamp = BigInt(mockNow - maxDays * daySeconds - 1000) // Expired
    const lockTime = BigInt(maxDays * daySeconds)

    const result = calculateVotingPower({ amount, lockTime, timestamp })

    expect(result.votingPower).toBe(BigInt(0))
    expect(result.percentageOfMax).toBe(0)
  })

  it('should handle zero amount', function () {
    const amount = BigInt(0)
    const timestamp = BigInt(mockNow)
    const lockTime = BigInt(maxDays * daySeconds)

    const result = calculateVotingPower({ amount, lockTime, timestamp })

    expect(result.votingPower).toBe(BigInt(0))
    expect(result.percentageOfMax).toBe(0)
  })

  it('should decay linearly over time', function () {
    const amount = BigInt(1000e18)
    const maxTime = BigInt(maxDays * daySeconds)

    // At 75% time remaining
    const timestamp75 = BigInt(mockNow - Number(maxTime) / 4)
    const result75 = calculateVotingPower({
      amount,
      lockTime: maxTime,
      timestamp: timestamp75,
    })

    // At 25% time remaining
    const timestamp25 = BigInt(mockNow - (Number(maxTime) * 3) / 4)
    const result25 = calculateVotingPower({
      amount,
      lockTime: maxTime,
      timestamp: timestamp25,
    })

    expect(result75.percentageOfMax).toBeCloseTo(75, 0)
    expect(result25.percentageOfMax).toBeCloseTo(25, 0)
  })

  it('should handle 2 year lock (50% of max)', function () {
    const amount = BigInt(1000e18)
    const twoYears = BigInt(730 * daySeconds) // ~2 years
    const timestamp = BigInt(mockNow)

    const result = calculateVotingPower({
      amount,
      lockTime: twoYears,
      timestamp,
    })

    expect(result.percentageOfMax).toBeCloseTo(50, 0)
  })
})
