import { MessageDirection, MessageStatus } from '@eth-optimism/sdk'
import {
  type BtcDepositOperation,
  BtcDepositStatus,
  BtcWithdrawStatus,
  type DepositTunnelOperation,
  type EvmDepositOperation,
  EvmDepositStatus,
  type ToBtcWithdrawOperation,
  type ToEvmWithdrawOperation,
  type TunnelOperation,
  type WithdrawTunnelOperation,
} from 'types/tunnel'

export const isDeposit = (
  operation: TunnelOperation,
): operation is DepositTunnelOperation =>
  operation.direction === MessageDirection.L1_TO_L2

export const isBtcOperation = (operation: TunnelOperation) =>
  typeof operation.l1ChainId === 'string'

export const isEvmOperation = (operation: TunnelOperation) =>
  typeof operation.l1ChainId === 'number'

export const isBtcDeposit = (
  operation: DepositTunnelOperation,
): operation is BtcDepositOperation => isBtcOperation(operation)

export const isEvmDeposit = (
  operation: DepositTunnelOperation,
): operation is EvmDepositOperation => isEvmOperation(operation)

export const isWithdraw = (
  operation: TunnelOperation,
): operation is WithdrawTunnelOperation =>
  operation.direction === MessageDirection.L2_TO_L1

export const isToBtcWithdraw = (
  withdraw: WithdrawTunnelOperation,
): withdraw is ToBtcWithdrawOperation => isBtcOperation(withdraw)

export const isToEvmWithdraw = (
  withdraw: WithdrawTunnelOperation,
): withdraw is ToEvmWithdrawOperation => isEvmOperation(withdraw)

export const getOperationFromDeposit = function (
  deposit: DepositTunnelOperation,
) {
  if (isEvmDeposit(deposit)) {
    // only action available for EVM deposits is view
    return 'view'
  }

  const btcDepositStatusToAction = {
    [BtcDepositStatus.TX_PENDING]: 'deposit',
    [BtcDepositStatus.TX_CONFIRMED]: 'deposit',
    [BtcDepositStatus.BTC_READY_CLAIM]: 'claim',
    [BtcDepositStatus.BTC_DEPOSITED]: 'view',
  } as const

  return btcDepositStatusToAction[deposit.status]
}

const btcDepositCompletedActions = [
  BtcDepositStatus.BTC_DEPOSITED,
  BtcDepositStatus.DEPOSIT_TX_FAILED,
]

const btcWithdrawCompletedActions = [
  BtcWithdrawStatus.WITHDRAWAL_FAILED,
  BtcWithdrawStatus.WITHDRAWAL_SUCCEEDED,
  BtcWithdrawStatus.WITHDRAWAL_CHALLENGED,
  BtcWithdrawStatus.CHALLENGE_FAILED,
]

const evmDepositCompletedActions = [
  EvmDepositStatus.DEPOSIT_TX_CONFIRMED,
  EvmDepositStatus.DEPOSIT_TX_FAILED,
]

const evmWithdrawCompletedActions = [MessageStatus.RELAYED]

const isDepositPendingOperation = function (
  operation: DepositTunnelOperation,
): boolean {
  if (isBtcDeposit(operation)) {
    return !btcDepositCompletedActions.includes(operation.status)
  }

  return !evmDepositCompletedActions.includes(operation.status)
}

const isWithdrawPendingOperation = function (
  operation: WithdrawTunnelOperation,
): boolean {
  if (isToEvmWithdraw(operation)) {
    return !evmWithdrawCompletedActions.includes(operation.status)
  }

  return !btcWithdrawCompletedActions.includes(operation.status)
}

export const isPendingOperation = function (
  operation: TunnelOperation,
): boolean {
  if (isDeposit(operation)) {
    return isDepositPendingOperation(operation)
  }

  return isWithdrawPendingOperation(operation)
}
