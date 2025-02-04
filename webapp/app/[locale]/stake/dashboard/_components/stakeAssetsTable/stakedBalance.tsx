import { RenderBalance } from 'components/balance'
import { StakeToken } from 'types/stake'

import { useStakedBalance } from '../../../_hooks/useStakedBalance'

type Props = {
  token: StakeToken
}

export const StakedBalance = ({ token }: Props) => (
  <RenderBalance {...useStakedBalance(token)} token={token} />
)
