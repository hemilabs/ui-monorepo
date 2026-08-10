import { describe, expect, it } from 'vitest'

import {
  clampSlippage,
  getSlippageLevel,
  percentToBps,
  sanitizeSlippage,
} from '../../../../../app/[locale]/hemi-earn/_utils/slippage'

describe('clampSlippage', function () {
  it('floors zero, which would make minOut equal the quote exactly', function () {
    expect(clampSlippage(0)).toBe(0.1)
  })

  it('floors anything below the minimum', function () {
    expect(clampSlippage(0.05)).toBe(0.1)
  })

  it('leaves the minimum itself untouched', function () {
    expect(clampSlippage(0.1)).toBe(0.1)
  })

  it('leaves values above the minimum untouched', function () {
    expect(clampSlippage(0.5)).toBe(0.5)
    expect(clampSlippage(20)).toBe(20)
  })

  // applySlippage throws outside the bps range and runs during render, so no value
  // may escape upwards either.
  it('caps at the maximum', function () {
    expect(clampSlippage(100)).toBe(100)
    expect(clampSlippage(150)).toBe(100)
    expect(clampSlippage(Number.POSITIVE_INFINITY)).toBe(100)
  })

  // NaN survives Math.min/Math.max and would reach BigInt(), throwing mid-render.
  it('falls back to the minimum for NaN', function () {
    expect(clampSlippage(Number.NaN)).toBe(0.1)
  })

  it('clamps negative infinity to the minimum', function () {
    expect(clampSlippage(Number.NEGATIVE_INFINITY)).toBe(0.1)
  })
})

describe('percentToBps', function () {
  it('converts whole percents', function () {
    expect(percentToBps(0)).toBe(BigInt(0))
    expect(percentToBps(1)).toBe(BigInt(100))
    expect(percentToBps(20)).toBe(BigInt(2000))
  })

  it('converts one-decimal percents exactly', function () {
    expect(percentToBps(0.5)).toBe(BigInt(50))
    expect(percentToBps(12.5)).toBe(BigInt(1250))
    expect(percentToBps(0.1)).toBe(BigInt(10))
  })

  it('stays inside the range applySlippage accepts', function () {
    expect(percentToBps(100)).toBe(BigInt(10000))
  })
})

describe('getSlippageLevel', function () {
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

describe('sanitizeSlippage', function () {
  it('keeps an empty string so the field can be cleared', function () {
    expect(sanitizeSlippage('')).toBe('')
  })

  it('accepts whole numbers', function () {
    expect(sanitizeSlippage('5')).toBe('5')
    expect(sanitizeSlippage('100')).toBe('100')
  })

  it('accepts a single decimal digit', function () {
    expect(sanitizeSlippage('0.5')).toBe('0.5')
    expect(sanitizeSlippage('12.5')).toBe('12.5')
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

  it('rejects a second decimal digit', function () {
    expect(sanitizeSlippage('0.25')).toBeNull()
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
