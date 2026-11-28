import { RenderCryptoBalance } from 'components/cryptoBalance'
import { type EvmToken } from 'types/token'
import { useAccount } from 'wagmi'

import { useVaultForm } from '../_context/vaultFormContext'
import { useUserShareValue } from '../_hooks/useUserShareValue'

export const WithdrawShareBalance = function ({ token }: { token: EvmToken }) {
  const { vault } = useVaultForm()
  const { isConnected } = useAccount()
  const { data, status } = useUserShareValue({
    shareAddress: vault.shareAddress,
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
