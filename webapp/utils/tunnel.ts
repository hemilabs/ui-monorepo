import { MessageDirection } from '@eth-optimism/sdk'
import { TunnelOperation } from 'app/context/tunnelHistoryContext'

export const isDeposit = ({ direction }: TunnelOperation) =>
  direction === MessageDirection.L1_TO_L2
