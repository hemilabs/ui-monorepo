import { MessageStatus } from '@eth-optimism/sdk'
import { featureFlags } from 'app/featureFlags'
import { useBtcDeposits } from 'hooks/useBtcDeposits'
import { useToEvmWithdrawals } from 'hooks/useToEvmWithdrawals'
import { BtcDepositStatus } from 'types/tunnel'

export const ActionableOperations = function () {
  const deposits = useBtcDeposits()
  const withdrawals = useToEvmWithdrawals()

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

  // Styles differ for single-digit
  const extraStyles =
    actionableOperations < 10
      ? 'aspect-square px-[3.5px] py-[1.5px]'
      : 'px-1.5 py-0.5'

  return (
    <span
      className={`text-ms flex ${extraStyles} h-4 items-center justify-center rounded-full bg-orange-500 text-center font-medium leading-3 text-white`}
    >
      {actionableOperations}
    </span>
  )
}
