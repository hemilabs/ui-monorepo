import { MessageDirection } from '@eth-optimism/sdk'
import {
  type BtcDepositOperation,
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
