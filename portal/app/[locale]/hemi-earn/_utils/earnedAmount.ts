import Big from 'big.js'

// Unrealized earned USD for one position: current pegged value minus the pegged
// cost basis, converted to token units and priced. Both inputs are pegged base
// units — the cost basis carries WAD precision so it may be fractional. Reads
// negative when the vault's share price has drifted below cost (an ERC-4626
// yield vault can lose value); surfaced as-is rather than floored at 0.
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
