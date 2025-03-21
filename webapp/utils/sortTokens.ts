import { StakeToken } from 'types/stake'
import { formatUnits } from 'viem'

/**
 * Checks if a token has any wallet balance
 */
const hasBalance = (token: StakeToken): boolean =>
  token.balance !== undefined && token.balance > BigInt(0)

/**
 * Gets a normalized balance value for comparison
 * Takes into account token decimals
 */
const getComparableBalance = function (token: StakeToken): number {
  if (!token.balance || token.balance <= BigInt(0)) {
    return 0
  }

  try {
    return parseFloat(formatUnits(token.balance, token.decimals))
  } catch {
    return Number(token.balance)
  }
}

/**
 * Sorts tokens according to the specified rules:
 * 1. hemiBTC, USDT, USDC at the top (in that order)
 * 2. Then tokens the user has in their wallet, sorted by wallet balance (descending)
 * 3. Remaining tokens in alphabetical order
 *
 * The function first checks if tokens are priority tokens (hemiBTC, USDT, USDC).
 * It then sorts tokens with wallet balance before those without.
 * For tokens with balance, it sorts by balance amount (higher balances first).
 * Finally, it alphabetically sorts any remaining tokens by symbol.
 */

export const sortTokens = function (tokens: StakeToken[]): StakeToken[] {
  const prioritySymbols = ['hemiBTC', 'USDT', 'USDC']

  return [...tokens].sort(function (a, b) {
    const aBaseSymbol = a.symbol.replace('.e', '')
    const bBaseSymbol = b.symbol.replace('.e', '')

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
      const aValue = getComparableBalance(a)
      const bValue = getComparableBalance(b)

      return bValue - aValue
    }

    return a.symbol.localeCompare(b.symbol)
  })
}
