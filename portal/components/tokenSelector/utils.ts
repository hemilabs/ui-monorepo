import uniqBy from 'lodash/uniqBy'
import { type Token } from 'types/token'

export const maxSymbolLength = 10

/**
 * Symbols are read from the token contract, so they can be arbitrarily long
 * (i.e. mooStakeDao-VUSD-crvUSD). The CSS truncates them to the width the
 * layout gives them, so this only decides whether the full symbol is worth
 * showing in a tooltip.
 */
export const isSymbolTooLong = (symbol: string) =>
  symbol.length > maxSymbolLength

export const maxQuickSelectionTokens = 3

export const getQuickSelectionTokens = function ({
  priorityAddresses,
  tokens,
  topTokens,
}: {
  priorityAddresses: Token['address'][]
  tokens: Token[]
  topTokens: Token[]
}) {
  const priorityTokens = priorityAddresses
    .map(address => tokens.find(token => token.address === address))
    .filter(token => token !== undefined)

  return uniqBy(topTokens.concat(priorityTokens), 'address').slice(
    0,
    maxQuickSelectionTokens,
  )
}
