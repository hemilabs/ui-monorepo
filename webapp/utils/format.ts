import { type Account } from 'btc-wallet/unisat'
import { shorten } from 'crypto-shortener'
import { smartRound } from 'smart-round'
import { type Address } from 'viem'

export const formatBtcAddress = (account: Account) =>
  shorten(account, { length: 5 })

export const formatEvmAddress = (address: Address) =>
  shorten(address, { length: 4, prefixes: ['0x'] })

const cryptoRounder = smartRound(6, 0, 6)
const fiatRounder = smartRound(6, 2, 2)

export const formatNumber = (value: number | string) =>
  cryptoRounder(value, { roundingMode: 'round-down', shouldFormat: true })

export const formatFiatNumber = (value: number | string) =>
  fiatRounder(value, { shouldFormat: true })
