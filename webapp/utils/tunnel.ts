import { MessageDirection } from '@eth-optimism/sdk'
import {
  DepositOperation,
  TunnelOperation,
} from 'app/context/tunnelHistoryContext/types'

export const isDeposit = (
  operation: TunnelOperation,
): operation is DepositOperation =>
  operation.direction === MessageDirection.L1_TO_L2
