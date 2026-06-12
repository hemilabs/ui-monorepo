import { MaxButton } from 'components/setMaxBalance'
import { formatUnits } from 'viem'

import { usePoolForm } from '../_context/poolFormContext'
import { useUserShareValue } from '../_hooks/useUserShareValue'

type Props = {
  disabled: boolean
  onSetMaxBalance: (amount: string) => void
}

export const WithdrawMaxBalance = function ({
  disabled,
  onSetMaxBalance,
}: Props) {
  const { pool } = usePoolForm()
  const { data, isPending } = useUserShareValue({
    shareAddress: pool.shareAddress,
  })
  const balance = data?.shares

  return (
    <MaxButton
      disabled={
        disabled || isPending || balance === undefined || balance <= BigInt(0)
      }
      onClick={
        balance !== undefined
          ? () =>
              onSetMaxBalance(formatUnits(balance, pool.shareToken.decimals))
          : undefined
      }
    />
  )
}
