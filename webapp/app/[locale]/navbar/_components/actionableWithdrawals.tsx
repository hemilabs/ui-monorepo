import { MessageStatus } from '@eth-optimism/sdk'
import { TunnelHistoryContext } from 'context/tunnelHistoryContext'
import { useContext } from 'react'

export const ActionableWithdrawals = function () {
  const { withdrawals } = useContext(TunnelHistoryContext)

  const actionableWithdrawals = withdrawals.filter(w =>
    [MessageStatus.READY_TO_PROVE, MessageStatus.READY_FOR_RELAY].includes(
      w.status,
    ),
  ).length

  if (actionableWithdrawals === 0) {
    return null
  }

  return (
    <div className="-mt-1 flex aspect-square min-w-6 items-center justify-center rounded-full bg-orange-950 p-1 text-center text-xs text-white">
      {actionableWithdrawals}
    </div>
  )
}
