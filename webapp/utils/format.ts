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

export const formatTVL = function (amount: number | string) {
  if (Big(amount).lt(100_000)) {
    // for less than 100k, return "< $100k"
    return `< $100K`
  }
  // For the rest, show the full format
  return `$${formatFiatNumber(amount)}`
}
