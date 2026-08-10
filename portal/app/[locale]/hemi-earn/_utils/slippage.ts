import {
  highSlippageThreshold,
  maxSlippage,
  minSlippage,
  veryHighSlippageThreshold,
} from '../_constants/slippage'

export type SlippageLevel = 'high' | 'normal' | 'veryHigh'

export const clampSlippage = (percent: number) =>
  Math.min(Math.max(percent, minSlippage), maxSlippage)

export const percentToBps = (percent: number) =>
  BigInt(Math.round(percent * 100))

export function getSlippageLevel(percent: number) {
  if (percent > veryHighSlippageThreshold) return 'veryHigh'
  if (percent > highSlippageThreshold) return 'high'
  return 'normal'
}

// Returns the value to keep in the input, or null to reject the keystroke. A lone
// trailing dot is allowed so "1." can be typed on the way to "1.5".
export function sanitizeSlippage(raw: string) {
  if (raw === '') {
    return ''
  }
  const value = raw.replace(',', '.').replace(/^0+(?=\d)/, '')
  if (!/^\d+(\.\d?)?$/.test(value)) {
    return null
  }
  return Number(value) > maxSlippage ? null : value
}
