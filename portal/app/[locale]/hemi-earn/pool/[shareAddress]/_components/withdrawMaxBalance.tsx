import { MaxButton } from 'components/setMaxBalance'
import { type EvmToken } from 'types/token'
import { formatUnits } from 'viem'

import { usePoolForm } from '../_context/poolFormContext'
import { useUserPoolBalance } from '../_hooks/useUserPoolBalance'

type Props = {
  disabled: boolean
  onSetMaxBalance: (amount: string) => void
  token: EvmToken
}

export const WithdrawMaxBalance = function ({
  disabled,
  onSetMaxBalance,
  token,
}: Props) {
  const { pool, selectedAsset } = usePoolForm()
  const { data, isPending } = useUserPoolBalance({
    assetAddress: selectedAsset.address,
    shareAddress: pool.shareAddress,
  })
  const balance = data?.assetOut

  return (
    <MaxButton
      disabled={
        disabled || isPending || balance === undefined || balance <= BigInt(0)
      }
      onClick={
        balance !== undefined
          ? () => onSetMaxBalance(formatUnits(balance, token.decimals))
          : undefined
      }
    />
  )
}
