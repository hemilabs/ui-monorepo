export const maxSymbolLength = 10

/**
 * Symbols are read from the token contract, so they can be arbitrarily long
 * (i.e. mooStakeDao-VUSD-crvUSD). The CSS truncates them to the width the
 * layout gives them, so this only decides whether the full symbol is worth
 * showing in a tooltip.
 */
export const isSymbolTooLong = (symbol: string) =>
  symbol.length > maxSymbolLength
