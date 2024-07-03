import { MessageDirection } from '@eth-optimism/sdk'
import {
  EvmDepositOperation,
  TunnelOperation,
} from 'app/context/tunnelHistoryContext/types'

export const isDeposit = (
  operation: TunnelOperation,
): operation is EvmDepositOperation =>
  operation.direction === MessageDirection.L1_TO_L2
