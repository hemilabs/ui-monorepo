import { MessageDirection, MessageStatus } from '@eth-optimism/sdk'
import {
  type BtcDepositOperation,
  BtcDepositStatus,
  type DepositTunnelOperation,
  type EvmDepositOperation,
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

export const getOperationFromWithdraw = function (
  withdraw: WithdrawTunnelOperation,
) {
  if (isToEvmWithdraw(withdraw)) {
    const evmWithdrawStatusAction = {
      [MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE]: 'withdraw',
      [MessageStatus.FAILED_L1_TO_L2_MESSAGE]: 'withdraw',
      [MessageStatus.STATE_ROOT_NOT_PUBLISHED]: 'prove',
      [MessageStatus.READY_TO_PROVE]: 'prove',
      [MessageStatus.IN_CHALLENGE_PERIOD]: 'claim',
      [MessageStatus.READY_FOR_RELAY]: 'claim',
      [MessageStatus.RELAYED]: 'view',
    } as const
    return evmWithdrawStatusAction[withdraw.status]
  }
  return 'view'
}
