import { describe, expect, it } from 'vitest'

import {
  clampSlippage,
  getSlippageLevel,
  needsRiskConfirmation,
  percentToBps,
  resolveRetrySlippage,
  sanitizeSlippage,
} from '../../../../../app/[locale]/hemi-earn/_utils/slippage'

describe('clampSlippage', function () {
  it('keeps zero, which is now warned about rather than corrected', function () {
    expect(clampSlippage(0)).toBe(0)
  })

  it('leaves any value inside the range untouched', function () {
    expect(clampSlippage(0.05)).toBe(0.05)
    expect(clampSlippage(0.5)).toBe(0.5)
    expect(clampSlippage(20)).toBe(20)
  })

  // applySlippage throws outside the bps range and runs during render, so no value
  // may escape either end.
  it('caps at the maximum', function () {
    expect(clampSlippage(100)).toBe(100)
    expect(clampSlippage(150)).toBe(100)
    expect(clampSlippage(Number.POSITIVE_INFINITY)).toBe(100)
  })

  it('floors negatives at zero', function () {
    expect(clampSlippage(-1)).toBe(0)
    expect(clampSlippage(Number.NEGATIVE_INFINITY)).toBe(0)
  })

  // NaN survives Math.min/Math.max and would reach BigInt(), throwing mid-render.
  it('falls back to zero for NaN', function () {
    expect(clampSlippage(Number.NaN)).toBe(0)
  })
})

describe('resolveRetrySlippage', function () {
  it('replays the value the failed attempt was signed with', function () {
    expect(resolveRetrySlippage({ fallback: 0.5, slippage: 8 })).toBe(8)
  })

  // Entries written before the field existed, so the retry must still resolve to something.
  it('falls back when the entry predates the field', function () {
    expect(resolveRetrySlippage({ fallback: 0.5 })).toBe(0.5)
  })

  it('keeps a recorded zero rather than treating it as missing', function () {
    expect(resolveRetrySlippage({ fallback: 0.5, slippage: 0 })).toBe(0)
  })

  // The value round-trips through localStorage, so it reaches applySlippage unvalidated.
  it('clamps a recorded value that is out of range', function () {
    expect(resolveRetrySlippage({ fallback: 1, slippage: 150 })).toBe(100)
    expect(resolveRetrySlippage({ fallback: 1, slippage: -5 })).toBe(0)
    expect(resolveRetrySlippage({ fallback: 1, slippage: Number.NaN })).toBe(0)
  })
})

describe('percentToBps', function () {
  it('converts whole percents', function () {
    expect(percentToBps(0)).toBe(BigInt(0))
    expect(percentToBps(1)).toBe(BigInt(100))
    expect(percentToBps(20)).toBe(BigInt(2000))
  })

  it('converts up to two decimals exactly', function () {
    expect(percentToBps(0.5)).toBe(BigInt(50))
    expect(percentToBps(12.5)).toBe(BigInt(1250))
    expect(percentToBps(0.1)).toBe(BigInt(10))
    expect(percentToBps(0.25)).toBe(BigInt(25))
    expect(percentToBps(0.05)).toBe(BigInt(5))
  })

  it('stays inside the range applySlippage accepts', function () {
    expect(percentToBps(100)).toBe(BigInt(10000))
  })
})

describe('getSlippageLevel', function () {
  it('flags values below the low threshold, where minOut matches the quote', function () {
    expect(getSlippageLevel(0)).toBe('low')
    expect(getSlippageLevel(0.05)).toBe('low')
  })

  it('treats the low threshold itself as normal', function () {
    expect(getSlippageLevel(0.1)).toBe('normal')
  })

  it('treats values at or below the high threshold as normal', function () {
    expect(getSlippageLevel(0.5)).toBe('normal')
    expect(getSlippageLevel(4.9)).toBe('normal')
    expect(getSlippageLevel(5)).toBe('normal')
  })

  it('treats values above the high threshold as high', function () {
    expect(getSlippageLevel(5.1)).toBe('high')
    expect(getSlippageLevel(10)).toBe('high')
  })

  it('treats values above the very high threshold as very high', function () {
    expect(getSlippageLevel(10.1)).toBe('veryHigh')
    expect(getSlippageLevel(20)).toBe('veryHigh')
    expect(getSlippageLevel(100)).toBe('veryHigh')
  })
})

describe('needsRiskConfirmation', function () {
  it('gates only the upper end, where the cost is silent', function () {
    expect(needsRiskConfirmation('high')).toBe(true)
    expect(needsRiskConfirmation('veryHigh')).toBe(true)
  })

  it('lets a too-low value through, since it reverts rather than costs', function () {
    expect(needsRiskConfirmation('low')).toBe(false)
    expect(needsRiskConfirmation('normal')).toBe(false)
  })
})

describe('sanitizeSlippage', function () {
  it('keeps an empty string so the field can be cleared', function () {
    expect(sanitizeSlippage('')).toBe('')
  })

  it('accepts whole numbers', function () {
    expect(sanitizeSlippage('5')).toBe('5')
    expect(sanitizeSlippage('100')).toBe('100')
  })

  it('accepts up to two decimals, which percentToBps maps exactly', function () {
    expect(sanitizeSlippage('0.5')).toBe('0.5')
    expect(sanitizeSlippage('12.5')).toBe('12.5')
    expect(sanitizeSlippage('0.25')).toBe('0.25')
    expect(sanitizeSlippage('0.05')).toBe('0.05')
  })

  it('allows a trailing dot while typing', function () {
    expect(sanitizeSlippage('1.')).toBe('1.')
  })

  it('normalizes a comma into a dot', function () {
    expect(sanitizeSlippage('0,5')).toBe('0.5')
  })

  it('strips leading zeros', function () {
    expect(sanitizeSlippage('007')).toBe('7')
    expect(sanitizeSlippage('01.5')).toBe('1.5')
  })

  it('keeps a lone zero', function () {
    expect(sanitizeSlippage('0')).toBe('0')
  })

  it('rejects a third decimal digit', function () {
    expect(sanitizeSlippage('0.255')).toBeNull()
  })

  it('rejects a leading dot', function () {
    expect(sanitizeSlippage('.5')).toBeNull()
  })

  it('rejects negative values', function () {
    expect(sanitizeSlippage('-1')).toBeNull()
  })

  it('rejects non-numeric input', function () {
    expect(sanitizeSlippage('abc')).toBeNull()
    expect(sanitizeSlippage('1e5')).toBeNull()
  })

  it('rejects values above 100', function () {
    expect(sanitizeSlippage('101')).toBeNull()
    expect(sanitizeSlippage('100.1')).toBeNull()
  })
})
