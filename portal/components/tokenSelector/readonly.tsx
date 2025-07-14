import { TokenLogo } from 'components/tokenLogo'
import { Token } from 'types/token'
import { getTokenSymbol } from 'utils/token'

type Props = {
  symbolRenderer?: (token: Token) => string
  token: Token
}

export const TokenSelectorReadOnly = ({
  symbolRenderer = getTokenSymbol,
  token,
}: Props) => (
  <div className="flex items-center justify-between gap-x-2">
    <TokenLogo size="small" token={token} />
    <span className="font-medium text-neutral-950">
      {symbolRenderer(token)}
    </span>
  </div>
)
