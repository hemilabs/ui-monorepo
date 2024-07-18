import { MessageStatus } from '@eth-optimism/sdk'
import { useTunnelHistory } from 'hooks/useTunnelHistory'

export const ActionableWithdrawals = function () {
  const { withdrawals } = useTunnelHistory()

  const actionableWithdrawals = withdrawals.filter(w =>
    [MessageStatus.READY_TO_PROVE, MessageStatus.READY_FOR_RELAY].includes(
      w.status,
    ),
  ).length

  if (actionableWithdrawals === 0) {
    return null
  }

  return (
    <div className="flex aspect-square min-w-6 items-center justify-center rounded-full bg-orange-950 p-1 text-center text-xs text-white">
      {actionableWithdrawals}
    </div>
  )
}
