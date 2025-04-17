import Big from 'big.js'
import { StakeToken } from 'types/stake'
import { getTokenPrice } from 'utils/token'
import { formatUnits } from 'viem'

/**
 * Checks if a token has any wallet balance
 */
const hasBalance = (token: StakeToken): boolean =>
  token.balance !== undefined && token.balance > BigInt(0)

/**
 * Gets a comparable USD value of token balance
 * Takes into account token decimals AND token price
 */
const getComparableUsdBalance = function (
  token: StakeToken,
  prices: Record<string, string>,
): number {
  if (!token.balance || token.balance <= BigInt(0)) {
    return 0
  }

  try {
    const stringBalance = formatUnits(token.balance, token.decimals)

    const price = getTokenPrice(token, prices)

    return parseFloat(Big(stringBalance).times(price).toString())
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return 0
  }
}

/**
 * Sorts tokens according to the specified rules:
 * 1. hemiBTC, USDT, USDC at the top (in that order)
 * 2. Then tokens the user has in their wallet, sorted by USD value (descending)
 * 3. Remaining tokens in alphabetical order
 *
 * The function first checks if tokens are priority tokens (hemiBTC, USDT, USDC).
 * It then sorts tokens with wallet balance before those without.
 * For tokens with balance, it sorts by USD value (higher values first).
 * Finally, it alphabetically sorts any remaining tokens by symbol.
 *
 * @param tokens Array of tokens to sort
 * @param prices Token price data from useTokenPrices hook
 */

export const sortTokens = function (
  tokens: StakeToken[],
  prices: Record<string, string>,
): StakeToken[] {
  const prioritySymbols = ['hemiBTC', 'USDT', 'USDC']

  return [...tokens].sort(function (a, b) {
    const aBaseSymbol = a.symbol.replace('.e', '')
    const bBaseSymbol = b.symbol.replace('.e', '')

    // Priority tokens first
    const aPriorityIndex = prioritySymbols.indexOf(aBaseSymbol)
    const bPriorityIndex = prioritySymbols.indexOf(bBaseSymbol)

    if (aPriorityIndex !== -1 || bPriorityIndex !== -1) {
      if (aPriorityIndex !== -1 && bPriorityIndex !== -1) {
        return aPriorityIndex - bPriorityIndex
      }
      return aPriorityIndex !== -1 ? -1 : 1
    }

    const aHasBalance = hasBalance(a)
    const bHasBalance = hasBalance(b)

    if (aHasBalance !== bHasBalance) {
      return aHasBalance ? -1 : 1
    }

    if (aHasBalance && bHasBalance) {
      const aUsdValue = getComparableUsdBalance(a, prices)
      const bUsdValue = getComparableUsdBalance(b, prices)

      return bUsdValue - aUsdValue
    }

    return a.symbol.localeCompare(b.symbol)
  })
}
