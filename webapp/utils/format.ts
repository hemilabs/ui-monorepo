import Big from 'big.js'

export const fromUnits = (value: bigint, decimals = 2) =>
  Big(value.toString()).div(`1e${decimals}`).toFixed()

export const formatNumber = (value: string, fractionDigits = 2) =>
  new Intl.NumberFormat('en-us', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(parseFloat(value))
