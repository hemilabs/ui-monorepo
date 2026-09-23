import { dayMs, startOfDay, toDate } from './dates.ts'

/* eslint-disable sort-keys */
const periodDays: Record<string, number> = {
  '1w': 7,
  '1m': 30,
  '3m': 90,
  '6m': 180,
  '1y': 365,
}
/* eslint-enable sort-keys */

export const isPeriod = (period: string) => Object.hasOwn(periodDays, period)

export function getPeriodDates(period: string) {
  const lastDate = toDate(Date.now() - dayMs)
  const firstDate = toDate(
    startOfDay(lastDate) - (periodDays[period] - 1) * dayMs,
  )
  return { firstDate, lastDate }
}
