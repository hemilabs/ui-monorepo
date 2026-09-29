import { TokenLogo } from 'components/tokenLogo'
import { Token } from 'types/token'

import { TokenQuickSelectSkeleton } from './tokenQuickSelectSkeleton'
import { TokenSymbol } from './tokenSymbol'

type Props = {
  isLoading: boolean
  onSelect: (token: Token) => void
  tokens: Token[]
}

const tokenHoverBgMap: Record<string, string> = {
  ETH: 'bg-token-selector-hover-eth',
  USDC: 'bg-token-selector-hover-usdc',
  USDT: 'bg-token-selector-hover-usdt',
}

function getTokenHoverBgClass(symbol: string) {
  const entry = Object.entries(tokenHoverBgMap).find(([prefix]) =>
    symbol.startsWith(prefix),
  )
  return entry?.[1] ?? 'bg-neutral-100'
}

export const TokenQuickSelect = function ({
  isLoading,
  onSelect,
  tokens,
}: Props) {
  if (isLoading) {
    return <TokenQuickSelectSkeleton />
  }

  return (
    <div className="flex gap-x-3">
      {tokens.map(token => (
        <div
          className="group relative flex-1 rounded-lg bg-white shadow-sm"
          key={token.address}
        >
          {/* Inner hover background */}
          <div
            className={`${getTokenHoverBgClass(
              token.symbol,
            )} pointer-events-none absolute inset-1 rounded opacity-0 transition-opacity duration-200 group-hover:opacity-100`}
          />

          <button
            className="relative z-10 flex w-full flex-col items-center gap-y-1 pb-2 pt-4"
            onClick={() => onSelect(token)}
            type="button"
          >
            <div className="scale-125">
              <TokenLogo size="small" token={token} />
            </div>
            <TokenSymbol
              className="text-sm font-medium text-neutral-950"
              symbol={token.symbol}
            />
          </button>
        </div>
      ))}
    </div>
  )
}
