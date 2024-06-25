import { TokenBridgeMessage, MessageStatus } from '@eth-optimism/sdk'

export type DepositOperation = Omit<
  TokenBridgeMessage,
  'amount' | 'blockNumber'
> & {
  amount: string
  blockNumber?: number
  timestamp: number
}

export type WithdrawOperation = Omit<
  TokenBridgeMessage,
  'amount' | 'blockNumber'
> & {
  amount: string
  blockNumber?: number
  status?: MessageStatus
  timestamp: number
}

export type TunnelOperation = DepositOperation | WithdrawOperation
export type RawTunnelOperation<T extends TunnelOperation> = Omit<T, 'timestamp'>
