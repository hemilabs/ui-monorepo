// Symbols are read from the token contract, so they can be arbitrarily long
// (i.e. mooStakeDao-VUSD-crvUSD). The CSS truncates them to the width the
// layout gives them - this is only used to decide whether the full symbol is
// worth showing in a tooltip.
export const maxSymbolLength = 10

export const isSymbolTooLong = (symbol: string) =>
  symbol.length > maxSymbolLength
