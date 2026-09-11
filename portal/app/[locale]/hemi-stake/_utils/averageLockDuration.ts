import { secondsPerDay } from 'utils/time'

import { secondsPerYear } from './lockDurations'

const secondsPerWeek = 7 * secondsPerDay
const secondsPerMonth = secondsPerYear / 12

const toUnit = function (seconds: number) {
  if (seconds >= secondsPerYear) {
    return { unit: 'year' as const, value: seconds / secondsPerYear }
  }
  if (seconds >= secondsPerMonth) {
    return { unit: 'month' as const, value: seconds / secondsPerMonth }
  }
  if (seconds >= secondsPerWeek) {
    return { unit: 'week' as const, value: seconds / secondsPerWeek }
  }
  return { unit: 'day' as const, value: seconds / secondsPerDay }
}

export const formatAverageLockDuration = function (
  seconds: number,
  locale: string,
) {
  const { unit, value } = toUnit(seconds)
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    style: 'unit',
    unit,
    unitDisplay: 'long',
  }).format(value)
}
