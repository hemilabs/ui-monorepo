export const toFraction = function (numerator: bigint, denominator: bigint) {
  if (denominator === BigInt(0)) {
    return 0
  }
  return Number(numerator) / Number(denominator)
}

export const maxBigInt = (...values: bigint[]) =>
  values.reduce((max, v) => (v > max ? v : max))

export const minBigInt = (...values: bigint[]) =>
  values.reduce((min, v) => (v < min ? v : min))
