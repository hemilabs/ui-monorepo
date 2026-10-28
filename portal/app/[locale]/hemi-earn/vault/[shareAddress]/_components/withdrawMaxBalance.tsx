import { MaxButton } from 'components/setMaxBalance'
import { formatUnits } from 'viem'

import { useVaultForm } from '../_context/vaultFormContext'
import { useUserShareValue } from '../_hooks/useUserShareValue'

type Props = {
  disabled: boolean
  onSetMaxBalance: (amount: string) => void
}

export const WithdrawMaxBalance = function ({
  disabled,
  onSetMaxBalance,
}: Props) {
  const { vault } = useVaultForm()
  const { data, isPending } = useUserShareValue({
    shareAddress: vault.shareAddress,
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
              onSetMaxBalance(formatUnits(balance, vault.shareToken.decimals))
          : undefined
      }
    />
  )
}
