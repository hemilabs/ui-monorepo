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
