import { type TokenBridgeMessage, type MessageStatus } from '@eth-optimism/sdk'

type CommonOperation = Omit<
  TokenBridgeMessage,
  'amount' | 'blockNumber' | 'data' | 'logIndex'
> & { amount: string; timestamp: number }

export type BtcDepositOperation = CommonOperation & {
  blockNumber: number
}

export type EvmDepositOperation = CommonOperation & {
  blockNumber?: number
}

export type EvmWithdrawOperation = CommonOperation & {
  blockNumber?: number
  status?: MessageStatus
}

export type TunnelOperation = EvmDepositOperation | EvmWithdrawOperation
export type RawTunnelOperation<T extends TunnelOperation> = Omit<T, 'timestamp'>
