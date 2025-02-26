import { RenderFiatBalance } from 'components/fiatBalance'
import { StakeToken } from 'types/stake'

import { useStakedBalance } from '../_hooks/useStakedBalance'

type Props = {
  token: StakeToken
}

export const StakedBalanceUsd = function ({ token }: Props) {
  const { balance, fetchStatus, status } = useStakedBalance(token)

  return (
    <RenderFiatBalance
      balance={balance}
      fetchStatus={fetchStatus}
      queryStatus={status}
      token={token}
    />
  )
}
