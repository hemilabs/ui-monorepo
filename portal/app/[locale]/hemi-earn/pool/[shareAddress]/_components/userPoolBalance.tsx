import { RenderCryptoBalance } from 'components/cryptoBalance'
import { type EvmToken } from 'types/token'

import { usePoolForm } from '../_context/poolFormContext'
import { useUserPoolBalance } from '../_hooks/useUserPoolBalance'

type Props = {
  token: EvmToken
}

export const UserPoolBalance = function ({ token }: Props) {
  const { pool, selectedAsset } = usePoolForm()
  const { data, status } = useUserPoolBalance({
    assetAddress: selectedAsset.address,
    shareAddress: pool.shareAddress,
  })

  return (
    <RenderCryptoBalance
      balance={data?.assetOut}
      status={status}
      token={token}
    />
  )
}
