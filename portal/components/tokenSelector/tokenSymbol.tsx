import { Tooltip } from 'components/tooltip'

import { isSymbolTooLong } from './utils'

type Props = {
  className?: string
  symbol: string
}

// Truncation is done by the CSS, so the symbol adapts to the width available.
// Both the selector and the read-only row bound it to the same width, so they
// truncate alike.
export const TokenSymbol = ({ className, symbol }: Props) => (
  <Tooltip
    disabled={!isSymbolTooLong(symbol)}
    id={`token-symbol-${symbol}`}
    text={symbol}
    // the selector opens a modal on click, so the tooltip must not react to it
    trigger={['hover', 'focus']}
    variant="simple"
  >
    <span className={`block max-w-20 truncate ${className}`}>{symbol}</span>
  </Tooltip>
)
