export const maxBigInt = (...values: bigint[]) =>
  values.reduce((max, v) => (v > max ? v : max))

export const minBigInt = (...values: bigint[]) =>
  values.reduce((min, v) => (v < min ? v : min))
