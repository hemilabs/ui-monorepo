import { MessageDirection } from '@eth-optimism/sdk'
import {
  BtcDepositOperation,
  EvmDepositOperation,
  TunnelOperation,
} from 'app/context/tunnelHistoryContext/types'
import { bitcoin } from 'app/networks'

export const isDeposit = (operation: TunnelOperation) =>
  operation.direction === MessageDirection.L1_TO_L2

export const isBtcDeposit = (
  operation: TunnelOperation,
): operation is BtcDepositOperation =>
  isDeposit(operation) && operation.chainId === bitcoin.id

export const isEvmDeposit = (
  operation: TunnelOperation,
): operation is EvmDepositOperation =>
  isDeposit(operation) && operation.chainId !== bitcoin.id
