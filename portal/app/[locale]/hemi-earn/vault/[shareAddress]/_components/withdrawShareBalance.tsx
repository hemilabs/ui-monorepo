import { RenderCryptoBalance } from 'components/cryptoBalance'
import { type EvmToken } from 'types/token'
import { useAccount } from 'wagmi'

import { usePoolForm } from '../_context/poolFormContext'
import { useUserShareValue } from '../_hooks/useUserShareValue'

export const WithdrawShareBalance = function ({ token }: { token: EvmToken }) {
  const { pool } = usePoolForm()
  const { isConnected } = useAccount()
  const { data, status } = useUserShareValue({
    shareAddress: pool.shareAddress,
  })

  if (!isConnected) {
    return <span>-</span>
  }

  return (
    <RenderCryptoBalance
      balance={data?.shares}
      skeletonWidth="wide"
      status={status}
      token={token}
    />
  )
}
