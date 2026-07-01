import { RenderCryptoBalance } from 'components/cryptoBalance'
import { type EvmToken } from 'types/token'
import { useAccount } from 'wagmi'

import { usePoolForm } from '../_context/poolFormContext'
import { useMaxWithdrawableAsset } from '../_hooks/useMaxWithdrawableAsset'

export const WithdrawAvailableBalance = function ({
  token,
}: {
  token: EvmToken
}) {
  const { pool, selectedAsset } = usePoolForm()
  const { isConnected } = useAccount()
  const { data, status } = useMaxWithdrawableAsset({
    assetAddress: selectedAsset.address,
    shareAddress: pool.shareAddress,
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
