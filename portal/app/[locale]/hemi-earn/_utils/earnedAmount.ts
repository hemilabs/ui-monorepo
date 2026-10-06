import Big from 'big.js'

// Unrealized earned USD for one position: current pegged value minus the pegged
// cost basis, converted to token units and priced. Both inputs are pegged base
// units — the cost basis carries WAD precision so it may be fractional.
//
// Floored at 0 per position, not on the sum: a fresh deposit reads a few cents
// below cost because the share OFT trims the balance to its shared decimals, and
// on the sum that dust would still eat into whatever another position earned.
// The cost is that a real drawdown reads as no yield instead of a loss.
export const positionEarnedUsd = function ({
  costBasisBaseUnits,
  currentPegged,
  decimals,
  price,
}: {
  costBasisBaseUnits: string
  currentPegged: bigint
  decimals: number
  price: string
}) {
  const earned = Big(currentPegged.toString())
    .minus(costBasisBaseUnits)
    .div(Big(10).pow(decimals))
    .times(price)
  return earned.lt(0) ? Big(0) : earned
}
