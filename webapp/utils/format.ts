import Big from 'big.js'
import { parseUnits } from 'viem'

export const toUnits = (value: bigint | string, decimals) =>
  Big(`${Big(value.toString()).toFixed()}e+${decimals}`).toFixed(0)

export const fromUnits = (value: bigint | string, decimals: number) =>
  parseUnits(value.toString(), decimals)

export const formatNumber = (value: bigint | number, fractionDigits = 2) =>
  new Intl.NumberFormat('en-us', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value)
