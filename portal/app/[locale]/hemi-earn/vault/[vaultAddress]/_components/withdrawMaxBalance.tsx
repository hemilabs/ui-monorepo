import { MaxButton } from 'components/setMaxBalance'
import { type EvmToken } from 'types/token'
import { formatUnits } from 'viem'

import { useVaultForm } from '../_context/vaultFormContext'
import { useUserVaultBalance } from '../_hooks/useUserVaultBalance'

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
  const { pool } = useVaultForm()
  const { data: balance, isPending } = useUserVaultBalance(pool.vaultAddress)

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
