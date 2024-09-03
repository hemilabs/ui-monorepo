import { MessageStatus } from '@eth-optimism/sdk'
import { featureFlags } from 'app/featureFlags'
import { useBtcDeposits } from 'hooks/useBtcDeposits'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { BtcDepositStatus } from 'types/tunnel'

export const ActionableOperations = function () {
  const deposits = useBtcDeposits()
  const { withdrawals } = useTunnelHistory()

  const actionableWithdrawals = withdrawals.filter(w =>
    [MessageStatus.READY_TO_PROVE, MessageStatus.READY_FOR_RELAY].includes(
      w.status,
    ),
  ).length

  const actionableDeposits = featureFlags.btcTunnelEnabled
    ? deposits.filter(d => d.status === BtcDepositStatus.BTC_READY_CLAIM).length
    : 0

  const actionableOperations = actionableWithdrawals + actionableDeposits

  if (actionableOperations === 0) {
    return null
  }

  return (
    <div className="flex aspect-square min-w-6 items-center justify-center rounded-full bg-orange-950 p-1 text-center text-xs text-white">
      {actionableOperations}
    </div>
  )
}
