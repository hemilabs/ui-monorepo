import Big from 'big.js'

// Unrealized earned USD for one position: current pegged value minus the pegged
// cost basis, converted to token units and priced. Both inputs are pegged base
// units — the cost basis carries WAD precision so it may be fractional. Kept
// unclamped (a position can read negative); the caller floors the aggregate.
export const positionEarnedUsd = ({
  costBasisBaseUnits,
  currentPegged,
  decimals,
  price,
}: {
  costBasisBaseUnits: string
  currentPegged: bigint
  decimals: number
  price: string
}) =>
  Big(currentPegged.toString())
    .minus(costBasisBaseUnits)
    .div(Big(10).pow(decimals))
    .times(price)

// Floor the aggregate earned at 0 — an "earned" card shouldn't read negative
// (a cooldown-redeem window or peg/transfer edge can make the net slightly < 0).
export const clampEarnedUsd = (total: Big) => (total.lt(0) ? Big(0) : total)
