import Big from 'big.js'
import { type Account } from 'btc-wallet/unisat'
import { shorten } from 'crypto-shortener'
import { smartRound } from 'smart-round'
import { type Address, type Hash } from 'viem'

export const formatBtcAddress = (account: Account) =>
  shorten(account, { length: 5 })

export const formatEvmAddress = (address: Address) =>
  shorten(address, { length: 4, prefixes: ['0x'] })

const cryptoRounder = smartRound(6, 0, 6)
const fiatRounder = smartRound(6, 2, 2)
const fiatRounderTVL = smartRound(6, 0, 0)

export const formatEvmHash = (txHash: Hash) =>
  shorten(txHash, { length: 4, prefixes: ['0x'] })

export const formatNumber = (value: number | string) =>
  cryptoRounder(value, { roundingMode: 'round-down', shouldFormat: true })

export const formatFiatNumber = (value: number | string) =>
  fiatRounder(value, { shouldFormat: true })

export const formatPastTime = function (
  secondsFromNow: number,
  locale: string,
) {
  // We need to iterate from the largest unit to the smallest unit - so I prefer
  // so sort them like that
  /* eslint-disable sort-keys */
  const thresholdsInSeconds: Partial<
    Record<Intl.RelativeTimeFormatUnit, number>
  > = {
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

  const rtf = new Intl.RelativeTimeFormat(locale, { style: 'long' })

  for (const [unit, secondsInUnit] of Object.entries(thresholdsInSeconds)) {
    if (secondsFromNow > secondsInUnit || unit === 'second') {
      const value = Math.floor(secondsFromNow / secondsInUnit) * -1

      return rtf.format(value, unit as Intl.RelativeTimeFormatUnit)
    }
  }
  // should never reach here, adding this return it to avoid
  // adding "undefined" to the inferred returned type
  return ''
}

const formatFiatNumberTVL = (value: number | string) =>
  fiatRounderTVL(value, { shouldFormat: true })

export const formatTVL = function (amount: number | string) {
  if (Big(amount).lt(100_000)) {
    // for less than 100k, return "< $100k"
    return `< $100K`
  }
  // For the rest, show the full format
  return `$${formatFiatNumberTVL(amount)}`
}
