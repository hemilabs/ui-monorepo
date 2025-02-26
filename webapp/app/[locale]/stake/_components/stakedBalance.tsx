import { RenderCryptoBalance } from 'components/cryptoBalance'
import { StakeToken } from 'types/stake'

import { useStakedBalance } from '../_hooks/useStakedBalance'

type Props = {
  token: StakeToken
}

export const StakedBalance = ({ token }: Props) => (
  <RenderCryptoBalance {...useStakedBalance(token)} token={token} />
)
