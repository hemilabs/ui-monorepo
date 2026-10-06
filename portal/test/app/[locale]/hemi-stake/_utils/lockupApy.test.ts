import {
  maxDays,
  oneYear,
  sixMonths,
  twoYears,
} from 'app/[locale]/hemi-stake/_utils/lockCreationTimes'
import { getLockupApys } from 'app/[locale]/hemi-stake/_utils/lockupApy'
import { minLockAmount, SixDaysSeconds } from 've-hemi-actions'
import { describe, expect, it } from 'vitest'

const hemi = (amount: number) => BigInt(amount) * BigInt(1e18)

const inputs = {
  amount: hemi(1000),
  now: SixDaysSeconds * 3232,
  transferableClassBaseline: hemi(1_000_000),
  transferableClassWeight: hemi(5_000_000),
}

const apys = (overrides = {}) => getLockupApys({ ...inputs, ...overrides })

describe('getLockupApys', function () {
  it('returns one entry per preset, keyed by days', function () {
    expect(
      Object.keys(apys())
        .map(Number)
        .sort((a, b) => a - b),
    ).toEqual([sixMonths, oneYear, twoYears, maxDays].sort((a, b) => a - b))
  })

  it('grows with the lock duration', function () {
    const result = apys()
    expect(result[sixMonths]).toBeLessThan(result[oneYear])
    expect(result[oneYear]).toBeLessThan(result[twoYears])
    expect(result[twoYears]).toBeLessThan(result[maxDays])
  })

  it('falls back to the minimum amount instead of dividing by zero', function () {
    const result = apys({ amount: BigInt(0) })
    expect(result[maxDays]).toBeGreaterThan(0)
    expect(result[maxDays]).toBe(apys({ amount: minLockAmount })[maxDays])
  })

  it('prices an amount of its own once it clears the minimum', function () {
    const big = apys({ amount: hemi(2_000_000) })
    expect(big[maxDays]).toBeLessThan(apys({ amount: minLockAmount })[maxDays])
  })

  it('returns zero for every preset when the baseline is missing', function () {
    const result = apys({ transferableClassBaseline: BigInt(0) })
    expect(Object.values(result)).toEqual([0, 0, 0, 0])
  })
})
