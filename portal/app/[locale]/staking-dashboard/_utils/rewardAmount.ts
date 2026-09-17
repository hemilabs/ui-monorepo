import { formatNumber } from 'utils/format'
import { formatUnits } from 'viem'

// The smallest figure `formatNumber` can show - it rounds down to six decimals.
const smallestShown = '0.000001'

/**
 * A reward figure, rendered against the decimals the Lens reported beside it.
 *
 * Callers pass the row's decimals rather than the token list's: the registry mixes 18dp
 * and 8dp assets, and a stale list entry would render 0.085 hemiBTC as 0.00000000000085
 * without any error.
 *
 * A balance too small to print is not zero. `formatNumber` floors at six decimals, so at
 * 8dp anything under 100 base units showed as a flat `0.000000` next to a caption
 * counting it as a balance.
 */
export const formatRewardAmount = function ({
  amount,
  decimals,
}: {
  amount: bigint
  decimals: number
}) {
  const formatted = formatNumber(formatUnits(amount, decimals))
  // `Number` on a grouped figure ("1,234.5") is NaN, so only tiny amounts get here.
  return amount > BigInt(0) && Number(formatted) === 0
    ? `<${smallestShown}`
    : formatted
}
