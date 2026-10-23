import { canEnableAutoRelock } from 'app/[locale]/hemi-stake/_utils/autoRelockEligibility'
import { MinLockDurationSeconds, SixDaysSeconds } from 've-hemi-actions'
import { describe, expect, it } from 'vitest'

const now = SixDaysSeconds * 3232 + 1000
const epochStart = SixDaysSeconds * 3232

const position = ({
  endsAfterEpochStart = MinLockDurationSeconds,
  forfeitable = false,
  transferable = true,
} = {}) => ({
  effectiveLockEnd: BigInt(epochStart + endsAfterEpochStart),
  forfeitable,
  now,
  transferable,
})

describe('canEnableAutoRelock', function () {
  it('allows a lock that still has the contract minimum ahead of it', function () {
    expect(canEnableAutoRelock(position())).toBe(true)
  })

  it('refuses a lock one second short of the minimum', function () {
    expect(
      canEnableAutoRelock(
        position({ endsAfterEpochStart: MinLockDurationSeconds - 1 }),
      ),
    ).toBe(false)
  })

  it('measures the minimum from the epoch start, not from now', function () {
    const lock = position({ endsAfterEpochStart: MinLockDurationSeconds })

    expect(Number(lock.effectiveLockEnd) - now).toBeLessThan(
      MinLockDurationSeconds,
    )
    expect(canEnableAutoRelock(lock)).toBe(true)
  })

  it('refuses a position that is not transferable yet', function () {
    expect(canEnableAutoRelock(position({ transferable: false }))).toBe(false)
  })

  it('refuses a forfeitable position', function () {
    expect(canEnableAutoRelock(position({ forfeitable: true }))).toBe(false)
  })

  it('refuses when the effective end is unknown', function () {
    expect(
      canEnableAutoRelock({ ...position(), effectiveLockEnd: undefined }),
    ).toBe(false)
  })
})
