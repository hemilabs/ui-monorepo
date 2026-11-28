import '@formatjs/intl-durationformat/polyfill.js'

import Big from 'big.js'
import { type Account, type BtcTransaction } from 'btc-wallet/unisat'
import { shorten } from 'crypto-shortener'
import { smartRound } from 'smart-round'
import { secondsPerDay } from 'utils/time'
import { type Address, type Hash } from 'viem'

export const formatBtcAddress = (account: Account) =>
  shorten(account, { length: 5 })

export const formatBtcHash = (txHash: BtcTransaction) =>
  shorten(txHash, { length: 4 })

export const formatEvmAddress = (address: Address) =>
  shorten(address, { length: 4, prefixes: ['0x'] })

export const formatEvmHash = (txHash: Hash) =>
  shorten(txHash, { length: 4, prefixes: ['0x'] })

const cryptoDecimals = 6
const cryptoRounder = smartRound(6, 0, cryptoDecimals)
const fiatRounder = smartRound(6, 2, 2)
const fiatRounderTVL = smartRound(6, 0, 0)
// Same config as fiatRounder, but I think it reads better to use a different rounder
const percentageRounder = smartRound(6, 2, 2)
const tokenPriceRounder = smartRound(6, 2, 6)

export const roundNumber = (value: number | string) =>
  cryptoRounder(value, { roundingMode: 'round-down' })

// Kept unformatted so it can be used in comparisons
export const smallestFormattedNumber = `0.${'0'.repeat(cryptoDecimals - 1)}1`

export const createFormatter = function (locale: string) {
  const formatNumber = (value: number | string) =>
    cryptoRounder(value, {
      locale,
      roundingMode: 'round-down',
      shouldFormat: true,
    })

  const formatFiatNumber = (value: number | string) =>
    fiatRounder(value, { locale, shouldFormat: true })

  const formatFiatAmount = function (amount: number | string) {
    const value = Big(amount)
    return value.gt(0) && value.lt(0.01)
      ? `< $${formatFiatNumber(0.01)}`
      : `$${formatFiatNumber(amount)}`
  }

  const formatPercentage = (value: number | string) =>
    `${percentageRounder(value, { locale, shouldFormat: true })}%`

  const formatWholePercentage = (value: number) =>
    `${new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
      // Avoid "-0%" for small negative values that round to zero
      signDisplay: 'negative',
    }).format(value)}%`

  const formatFullAmount = (amount: string, decimals: number) =>
    new Intl.NumberFormat(locale, {
      maximumFractionDigits: decimals,
      useGrouping: true,
    }).format(
      // @ts-expect-error NumberFormat.format accept strings, typings are wrong. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/format#parameters
      amount,
    )

  const formatApyDisplay = function (apy: number) {
    if (apy !== 0 && apy > -0.01 && apy < 0.01) {
      return `< ${formatPercentage(apy > 0 ? 0.01 : -0.01)}`
    }
    return formatPercentage(apy)
  }

  const formatRelativeTime = function ({
    rounder,
    seconds,
  }: {
    rounder: (value: number) => number
    seconds: number
  }) {
    const rtf = new Intl.RelativeTimeFormat(locale, { style: 'long' })

    // We need to iterate from the largest unit to the smallest unit - so I prefer
    // so sort them like that
    /* eslint-disable sort-keys */
    const thresholds: Partial<Record<Intl.RelativeTimeFormatUnit, number>> = {
      // Defined to loosely match blockscout relative timestamps - all converted to seconds
      // See https://github.com/hemilabs/blockscout-frontend/blob/4f993ce5e62382ea98f42c6d79818630af331b9d/lib/date/dayjs.ts#L13
      year: 28944000, // 11 months, assuming 365 days - 30 days
      month: 2419200, // 4 weeks
      week: 518400, // 4 days
      day: 82800, // 23 hours
      hour: 3540, // 59 minutes
      minute: 59, // 59 seconds
      second: 1, // 1 second
    }
    /* eslint-enable sort-keys */

    for (const [unit, secondsInUnit] of Object.entries(thresholds)) {
      if (Math.abs(seconds) > secondsInUnit || unit === 'second') {
        const value = rounder(seconds / secondsInUnit)
        return rtf.format(value, unit as Intl.RelativeTimeFormatUnit)
      }
    }

    return rtf.format(0, 'second')
  }

  const formatPastTime = (secondsFromNow: number) =>
    formatRelativeTime({
      rounder: Math.ceil,
      // using -1 because we need RelativeFormat to render it in the past,
      // but secondsFromNow is an absolute value
      seconds: secondsFromNow * -1,
    })

  const formatFutureTime = (seconds: number) =>
    formatRelativeTime({ rounder: Math.floor, seconds })

  // When `maximumFractionDigits` is undefined, the Intl compact notation default
  // is used (it rounds based on significant digits, eg. "420M", "1.2B").
  // Compact notation defaults to "min2" grouping, which drops the separator on
  // 4-digit numbers (eg. "2065,44 M" in Spanish), so force it.
  const compactFiatFormatter = (
    maximumFractionDigits?: number,
    roundingMode?: Intl.NumberFormatOptions['roundingMode'],
  ) =>
    new Intl.NumberFormat(locale, {
      compactDisplay: 'short',
      notation: 'compact',
      useGrouping: 'always',
      ...(maximumFractionDigits !== undefined && { maximumFractionDigits }),
      ...(roundingMode !== undefined && { roundingMode }),
    })

  const formatCompactFiat = (value: number, maximumFractionDigits?: number) =>
    `$${compactFiatFormatter(maximumFractionDigits).format(value)}`

  const formatFiatNumberTVL = (value: number | string) =>
    fiatRounderTVL(value, { locale, shouldFormat: true })

  const formatTVL = function (amount: number | string) {
    if (Big(amount).lt(100_000)) {
      return `< ${formatCompactFiat(100_000)}`
    }
    return `$${formatFiatNumberTVL(amount)}`
  }

  // Same as formatCompactFiat, but splits the numeric part from the K/M/B
  // suffix so callers can style them differently (eg. dim the suffix).
  const formatCompactFiatParts = function (
    value: number,
    maximumFractionDigits = 2,
    roundingMode?: Intl.NumberFormatOptions['roundingMode'],
  ) {
    const parts = compactFiatFormatter(
      maximumFractionDigits,
      roundingMode,
    ).formatToParts(value)
    const suffix = parts.find(p => p.type === 'compact')?.value ?? ''
    const number = parts
      .filter(p => p.type !== 'compact')
      .map(p => p.value)
      .join('')
    return { number, suffix }
  }

  const formatTokenPrice = (price: number | string) =>
    `$${tokenPriceRounder(price, { locale, shouldFormat: true })}`

  const formatDate = (date: Date, timeZone?: string) =>
    new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      timeZone,
      year: 'numeric',
    }).format(date)

  const formatShortDate = (date: Date, timeZone?: string) =>
    new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      timeZone,
    }).format(date)

  const formatShortDateWithYear = (date: Date, timeZone?: string) =>
    new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      timeZone,
      year: 'numeric',
    }).format(date)

  const formatDuration = function (durationSeconds: number) {
    // Thresholds in descending order - we want the biggest unit available
    const thresholds = [
      { seconds: 28944000, unit: 'years' as const }, // 11 months, assuming 365 days - 30 days
      { seconds: 2419200, unit: 'months' as const }, // 4 weeks
      { seconds: 518400, unit: 'weeks' as const }, // 4 days
      { seconds: 82800, unit: 'days' as const }, // 23 hours
      { seconds: 3540, unit: 'hours' as const }, // 59 minutes
      { seconds: 59, unit: 'minutes' as const }, // 59 seconds
      { seconds: 1, unit: 'seconds' as const }, // 1 second
    ]

    for (const { seconds: thresholdSeconds, unit } of thresholds) {
      if (durationSeconds >= thresholdSeconds) {
        const value = Math.floor(durationSeconds / thresholdSeconds)
        return new Intl.DurationFormat(locale, { style: 'long' }).format({
          [unit]: value,
        })
      }
    }

    return new Intl.DurationFormat(locale, { style: 'long' }).format({
      seconds: 0,
    })
  }

  const formatAverageLockDuration = function (seconds: number) {
    const secondsPerYear = 365.25 * secondsPerDay
    const secondsPerMonth = secondsPerYear / 12
    const secondsPerWeek = 7 * secondsPerDay

    const { unit, value } =
      seconds >= secondsPerYear
        ? { unit: 'year' as const, value: seconds / secondsPerYear }
        : seconds >= secondsPerMonth
          ? { unit: 'month' as const, value: seconds / secondsPerMonth }
          : seconds >= secondsPerWeek
            ? { unit: 'week' as const, value: seconds / secondsPerWeek }
            : { unit: 'day' as const, value: seconds / secondsPerDay }

    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1,
      style: 'unit',
      unit,
      unitDisplay: 'long',
    }).format(value)
  }

  return {
    formatApyDisplay,
    formatAverageLockDuration,
    formatCompactFiat,
    formatCompactFiatParts,
    formatDate,
    formatDuration,
    formatFiatAmount,
    formatFiatNumber,
    formatFullAmount,
    formatFutureTime,
    formatNumber,
    formatPastTime,
    formatPercentage,
    formatShortDate,
    formatShortDateWithYear,
    formatTokenPrice,
    formatTVL,
    formatWholePercentage,
  }
}

export type Formatter = ReturnType<typeof createFormatter>
