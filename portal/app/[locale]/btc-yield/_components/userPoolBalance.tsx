import { RenderCryptoBalance } from 'components/cryptoBalance'
import { type EvmToken } from 'types/token'

import { useUserPoolBalance } from '../_hooks/useUserPoolBalance'

type Props = {
  token: EvmToken
}

export const UserPoolBalance = function ({ token }: Props) {
  const { data: balance, status } = useUserPoolBalance()
  return <RenderCryptoBalance balance={balance} status={status} token={token} />
}
