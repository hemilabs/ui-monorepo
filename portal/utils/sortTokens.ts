import Big from 'big.js'
import { EvmToken } from 'types/token'
import { formatUnits } from 'viem'

import { getTokenPrice } from './token'

type SortableToken = EvmToken & {
  balance?: bigint
}

type Props<T extends SortableToken> = {
  tokens: T[]
  prices: Record<string, string> | undefined
  prioritySymbols?: string[]
}

export function sortTokens<T extends SortableToken>({
  prices,
  prioritySymbols = [],
  tokens,
}: Props<T>) {
  const hasBalance = (token: T): boolean =>
    token.balance !== undefined && token.balance > BigInt(0)

  const getComparableUsdBalance = function (token: T): number {
    if (!token.balance || token.balance <= BigInt(0)) return 0

    try {
      const stringBalance = formatUnits(token.balance, token.decimals)
      const price = getTokenPrice(token, prices)
      return parseFloat(Big(stringBalance).times(price).toString())
    } catch {
      return 0
    }
  }

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
      return getComparableUsdBalance(b) - getComparableUsdBalance(a)
    }

    return a.symbol.localeCompare(b.symbol)
  })
}
