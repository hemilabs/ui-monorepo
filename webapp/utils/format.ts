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

export const formatEvmHash = (txHash: Hash) =>
  shorten(txHash, { length: 4, prefixes: ['0x'] })

export const formatNumber = (value: number | string) =>
  cryptoRounder(value, { roundingMode: 'round-down', shouldFormat: true })

export const formatFiatNumber = (value: number | string) =>
  fiatRounder(value, { shouldFormat: true })

export const formatLargeFiatNumber = function (amount: number | string) {
  // for less than one million, use the regular format.
  if (Big(amount).lt(1_000_000)) {
    return formatFiatNumber(amount)
  }
  // for larger than that, use the million format.
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(
    // @ts-expect-error NumberFormat.format accept strings, typings are wrong. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/format#parameters
    amount,
  )
}
