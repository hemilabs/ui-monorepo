import { TokenLogo } from 'components/tokenLogo'
import { ComponentProps } from 'react'
import { Token } from 'types/token'

import { TokenSymbol } from './tokenSymbol'

type Props = {
  logoVersion?: ComponentProps<typeof TokenLogo>['version']
  token: Token
}

export const TokenSelectorReadOnly = ({ logoVersion, token }: Props) => (
  <div className="flex items-center justify-between gap-x-2">
    <TokenLogo size="small" token={token} version={logoVersion} />
    <TokenSymbol
      className="font-medium text-neutral-950"
      symbol={token.symbol}
    />
  </div>
)
