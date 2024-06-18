import Big from 'big.js'
import { type Account } from 'btc-wallet/unisat'
import { Address } from 'viem'

export const formatAddress = (address: Address | Account) =>
  `${address.slice(0, 4)}...${address.slice(-4)}`

export const formatNumber = (
  value: bigint | number | string,
  fractionDigits = 2,
) =>
  new Intl.NumberFormat('en-us', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
    // @ts-expect-error not defined in TS types yet - See https://github.com/microsoft/TypeScript/issues/56269
    roundingMode: 'floor',
    // @ts-expect-error NumberFormat.format accept strings, typings are wrong. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/format#parameters
  }).format(value)

export const getFormattedValue = (value: string) =>
  Big(value.replace(/,/g, '')).lt('0.001') ? '< 0.001' : formatNumber(value, 3)
