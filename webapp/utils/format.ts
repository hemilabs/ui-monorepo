import Big from 'big.js'

export const toUnits = (value: bigint | string, decimals) =>
  Big(`${Big(value.toString()).toFixed()}e+${decimals}`).toFixed(0)

export const fromUnits = (value: bigint | string, decimals) =>
  Big(value.toString()).div(`1e${decimals}`).toFixed()

export const formatNumber = (value: string, fractionDigits = 2) =>
  new Intl.NumberFormat('en-us', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(parseFloat(value))
