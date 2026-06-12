import { computeCooldownRemaining } from 'app/[locale]/hemi-earn/pool/[shareAddress]/_hooks/useEarnCooldownRemaining'
import { describe, expect, it } from 'vitest'

const now = 1_781_534_321

describe('computeCooldownRemaining', function () {
  it('returns undefined when claimableAt is undefined', function () {
    expect(computeCooldownRemaining(undefined, now)).toBeUndefined()
  })

  it('returns positive remaining seconds when claimableAt is ahead of now', function () {
    expect(computeCooldownRemaining(now + 3600, now)).toBe(3600)
  })

  it('clamps to 0 when claimableAt equals now', function () {
    expect(computeCooldownRemaining(now, now)).toBe(0)
  })

  it('clamps to 0 when claimableAt is in the past', function () {
    expect(computeCooldownRemaining(now - 1, now)).toBe(0)
  })

  it('accepts bigint inputs', function () {
    expect(computeCooldownRemaining(BigInt(now + 600), now)).toBe(600)
  })

  it('accepts number inputs', function () {
    expect(computeCooldownRemaining(now + 600, now)).toBe(600)
  })

  it('coerces bigint inputs above Number.MAX_SAFE_INTEGER without crashing', function () {
    // Realistic unix-seconds never approach this range, but the coerce
    // should not throw — the result becomes imprecise floating-point,
    // but the function returns a number rather than crashing.
    const huge = BigInt('9999999999999999')
    const result = computeCooldownRemaining(huge, now)
    expect(typeof result).toBe('number')
    expect(result).toBeGreaterThan(0)
  })
})
