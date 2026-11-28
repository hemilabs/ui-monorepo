const bpsDenominator = BigInt(10000)

export function bpsToPercent(bps: bigint) {
  if (bps < BigInt(0) || bps > bpsDenominator) {
    throw new RangeError(
      `bpsToPercent: bps must be in [0, ${bpsDenominator}], got ${bps}`,
    )
  }
  return Number(bps) / 100
}
