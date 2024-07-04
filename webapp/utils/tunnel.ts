import { MessageDirection } from '@eth-optimism/sdk'
import {
  BtcDepositOperation,
  EvmDepositOperation,
  TunnelOperation,
} from 'app/context/tunnelHistoryContext/types'
import { bitcoin } from 'app/networks'

export const isBtcDeposit = (
  operation: TunnelOperation,
): operation is BtcDepositOperation =>
  operation.direction === MessageDirection.L1_TO_L2 &&
  operation.chainId === bitcoin.id

export const isEvmDeposit = (
  operation: TunnelOperation,
): operation is EvmDepositOperation =>
  operation.direction === MessageDirection.L1_TO_L2 &&
  operation.chainId !== bitcoin.id
