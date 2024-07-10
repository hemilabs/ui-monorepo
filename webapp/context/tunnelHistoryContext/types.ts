import { type TokenBridgeMessage, type MessageStatus } from '@eth-optimism/sdk'
import { RemoteChain } from 'app/networks'

export const enum BtcDepositStatus {
  // The tx is in the mempool, but hasn't been included in a mined block
  TX_PENDING = 0,
  // The tx is part of a block that has been mined, but it doesn't have enough
  // confirmations for the erc20 bitcoin to be minted in Hemi
  TX_CONFIRMED = 1,
  // The bitcoin is ready to be claimed in Hemi, either by the custodial
  // or the owner of those bitcoins
  BTC_READY_CLAIM = 2,
  // The erc20 bitcoin version in Hemi has been minted
  BTC_DEPOSITED = 3,
}

type CommonOperation = Omit<
  TokenBridgeMessage,
  'amount' | 'blockNumber' | 'data' | 'logIndex'
> & {
  amount: string
  blockNumber?: number
  chainId: RemoteChain['id']
  timestamp?: number
}

export type BtcDepositOperation = CommonOperation & {
  status: BtcDepositStatus
}

export type EvmDepositOperation = CommonOperation

export type EvmWithdrawOperation = CommonOperation & {
  status?: MessageStatus
}

export type TunnelOperation =
  | BtcDepositOperation
  | EvmDepositOperation
  | EvmWithdrawOperation
export type RawTunnelOperation<T extends TunnelOperation> = Omit<T, 'timestamp'>
