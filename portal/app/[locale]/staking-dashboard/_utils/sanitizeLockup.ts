import { maxDays } from './constants'

export const sanitizeLockup = function ({
  input,
  value,
}: {
  input: string
  value: string
}) {
  if (!input) {
    return { value: '' }
  }

  const _cleaned = input.replace(/^0+/, '').trim()

  let num = Math.abs(Number.parseFloat(_cleaned))

  // If the input is not a valid number, return the current value.
  if (!Number.isFinite(num)) {
    return { value }
  }

  // If the input is a decimal, round it to the nearest integer.
  // 1460 days (4 years) is the maximum.
  num = Math.min(Math.floor(num), maxDays)

  return { value: String(num) }
}
