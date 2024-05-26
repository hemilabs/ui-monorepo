import { TokenBridgeMessage, MessageStatus } from '@eth-optimism/sdk'

export type DepositOperation = Omit<TokenBridgeMessage, 'amount'> & {
  amount: string
  timestamp: number
}

export type WithdrawOperation = Omit<TokenBridgeMessage, 'amount'> & {
  amount: string
  status?: MessageStatus
  timestamp: number
}

export type TunnelOperation = DepositOperation | WithdrawOperation
