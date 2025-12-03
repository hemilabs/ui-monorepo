import { MaxButton } from 'components/setMaxBalance'
import { EvmToken } from 'types/token'
import { formatUnits } from 'viem'

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
  const { data: balance, isPending } = useUserPoolBalance()

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
