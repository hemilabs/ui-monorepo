import { MessageDirection } from '@eth-optimism/sdk'
import {
  BtcDepositOperation,
  DepositTunnelOperation,
  EvmDepositOperation,
  TunnelOperation,
  WithdrawTunnelOperation,
} from 'types/tunnel'

export const isDeposit = (
  operation: TunnelOperation,
): operation is DepositTunnelOperation =>
  operation.direction === MessageDirection.L1_TO_L2

export const isBtcDeposit = (
  operation: DepositTunnelOperation,
): operation is BtcDepositOperation => typeof operation.l1ChainId === 'string'

export const isEvmDeposit = (
  operation: DepositTunnelOperation,
): operation is EvmDepositOperation => typeof operation.l1ChainId === 'number'

export const isWithdraw = (
  operation: TunnelOperation,
): operation is WithdrawTunnelOperation =>
  operation.direction === MessageDirection.L2_TO_L1
