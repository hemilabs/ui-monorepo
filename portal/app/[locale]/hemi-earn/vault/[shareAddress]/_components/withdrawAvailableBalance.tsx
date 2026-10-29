import { RenderCryptoBalance } from 'components/cryptoBalance'
import { type EvmToken } from 'types/token'
import { useAccount } from 'wagmi'

import { useVaultForm } from '../_context/vaultFormContext'
import { useMaxWithdrawableAsset } from '../_hooks/useMaxWithdrawableAsset'

export const WithdrawAvailableBalance = function ({
  token,
}: {
  token: EvmToken
}) {
  const { selectedAsset, vault } = useVaultForm()
  const { isConnected } = useAccount()
  const { data, status } = useMaxWithdrawableAsset({
    assetAddress: selectedAsset.address,
    shareAddress: vault.shareAddress,
  })

  if (!isConnected) {
    return <span>-</span>
  }

  return (
    <RenderCryptoBalance
      balance={data?.assetOut}
      showSymbol
      skeletonWidth="wide"
      status={status}
      token={token}
    />
  )
}
