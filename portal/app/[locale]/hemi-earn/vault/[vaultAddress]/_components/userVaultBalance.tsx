import { RenderCryptoBalance } from 'components/cryptoBalance'
import { type EvmToken } from 'types/token'

import { useVaultForm } from '../_context/vaultFormContext'
import { useUserVaultBalance } from '../_hooks/useUserVaultBalance'

type Props = {
  token: EvmToken
}

export const UserVaultBalance = function ({ token }: Props) {
  const { pool } = useVaultForm()
  const { data: balance, status } = useUserVaultBalance(
    pool.vaultAddress,
    pool.token.chainId,
  )

  return <RenderCryptoBalance balance={balance} status={status} token={token} />
}
