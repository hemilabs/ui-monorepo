import { MessageDirection } from '@eth-optimism/sdk'
import {
  BtcDepositOperation,
  DepositTunnelOperation,
  EvmDepositOperation,
  TunnelOperation,
  WithdrawTunnelOperation,
} from 'app/context/tunnelHistoryContext/types'
import { bitcoin } from 'app/networks'

export const isDeposit = (
  operation: TunnelOperation,
): operation is DepositTunnelOperation =>
  operation.direction === MessageDirection.L1_TO_L2

export const isBtcDeposit = (
  operation: DepositTunnelOperation,
): operation is BtcDepositOperation => operation.chainId === bitcoin.id

export const isEvmDeposit = (
  operation: DepositTunnelOperation,
): operation is EvmDepositOperation => operation.chainId !== bitcoin.id

export const isWithdraw = (
  operation: TunnelOperation,
): operation is WithdrawTunnelOperation =>
  operation.direction === MessageDirection.L2_TO_L1
