import { Token as TokenType } from 'types/token'

import { Balance } from '../balance'
import { TokenLogo } from '../tokenLogo'

type Props = {
  token: TokenType
}

export const Token = ({ token }: Props) => (
  <div className="flex items-center gap-x-3 p-2 text-sm font-medium text-neutral-950">
    <div className="flex-shrink-0 flex-grow-0">
      <TokenLogo size="medium" token={token} />
    </div>
    <div className="flex w-full flex-col">
      <div className="flex items-center justify-between">
        <span>{token.name}</span>
        <Balance token={token} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-neutral-500">{token.symbol}</span>
        {/*  Hiding as there are no usd rates so far*/}
        {/* <span>$1,234.12</span> */}
      </div>
    </div>
  </div>
)
