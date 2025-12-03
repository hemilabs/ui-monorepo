import { RenderCryptoBalance } from 'components/cryptoBalance'
import { type EvmToken } from 'types/token'

import { useUserPoolBalance } from '../_hooks/useUserPoolBalance'

type Props = {
  token: EvmToken
}

export const UserPoolBalance = function ({ token }: Props) {
  const { data: balance, fetchStatus, status } = useUserPoolBalance()
  return (
    <RenderCryptoBalance
      balance={balance ?? BigInt(0)}
      fetchStatus={fetchStatus}
      status={status}
      token={token}
    />
  )
}
