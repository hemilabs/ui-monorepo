import { TokenLogo } from 'components/tokenLogo'
import { EvmToken } from 'types/token'

type Props = {
  token: EvmToken
}

export const TokenTableTokenCell = ({ token }: Props) => (
  <div className="flex min-w-0 items-center gap-x-3">
    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-neutral-50">
      <TokenLogo size="small" token={token} />
    </div>
    <div className="flex min-w-0 flex-col">
      <span className="body-text-medium truncate text-neutral-950">
        {token.name}
      </span>
      <span className="body-text-normal truncate text-neutral-500">
        {token.symbol}
      </span>
    </div>
  </div>
)
