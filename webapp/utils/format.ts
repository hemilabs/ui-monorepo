export const formatNumber = (value: bigint | number, fractionDigits = 2) =>
  new Intl.NumberFormat('en-us', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value)
