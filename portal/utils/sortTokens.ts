import Big from 'big.js'
import { StakeToken } from 'types/stake'
import { getTokenPrice, getTokenSymbol } from 'utils/token'
import { formatUnits } from 'viem'

const hasBalance = (token: StakeToken): boolean =>
  token.balance !== undefined && token.balance > BigInt(0)

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

export const sortTokens = function (
  tokens: StakeToken[],
  prices: Record<string, string>,
): StakeToken[] {
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
      const aUsdValue = getComparableUsdBalance(a, prices)
      const bUsdValue = getComparableUsdBalance(b, prices)

      return bUsdValue - aUsdValue
    }

    return getTokenSymbol(a).localeCompare(getTokenSymbol(b))
  })
}
