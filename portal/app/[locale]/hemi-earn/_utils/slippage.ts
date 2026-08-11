import {
  highSlippageThreshold,
  lowSlippageThreshold,
  maxSlippage,
  veryHighSlippageThreshold,
} from '../_constants/slippage'

export type SlippageLevel = 'high' | 'low' | 'normal' | 'veryHigh'

// applySlippage throws outside the bps range and runs during render, NaN included,
// since it would reach BigInt() and throw there.
export const clampSlippage = (percent: number) =>
  Number.isNaN(percent) ? 0 : Math.min(Math.max(percent, 0), maxSlippage)

export const percentToBps = (percent: number) =>
  BigInt(Math.round(percent * 100))

export function getSlippageLevel(percent: number) {
  if (percent > veryHighSlippageThreshold) return 'veryHigh'
  if (percent > highSlippageThreshold) return 'high'
  if (percent < lowSlippageThreshold) return 'low'
  return 'normal'
}

export const needsRiskConfirmation = (level: SlippageLevel) =>
  level === 'high' || level === 'veryHigh'

// Returns the value to keep in the input, or null to reject the keystroke. A lone
// trailing dot is allowed so "1." can be typed on the way to "1.5".
export function sanitizeSlippage(raw: string) {
  if (raw === '') {
    return ''
  }
  const value = raw.replace(',', '.').replace(/^0+(?=\d)/, '')
  if (!/^\d+(\.\d{0,2})?$/.test(value)) {
    return null
  }
  return Number(value) > maxSlippage ? null : value
}
