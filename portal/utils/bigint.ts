export const maxBigInt = (...values: bigint[]) =>
  values.reduce((max, v) => (v > max ? v : max))
