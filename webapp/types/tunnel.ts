import {
  type TokenBridgeMessage,
  type MessageDirection,
  type MessageStatus,
} from '@eth-optimism/sdk'
import { BtcChain } from 'btc-wallet/chains'
import { BtcTransaction } from 'btc-wallet/unisat'
import { type RemoteChain } from 'types/chain'
import { type Chain, type Hash } from 'viem'

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
  | 'amount'
  | 'blockNumber'
  | 'chainId'
  | 'data'
  | 'direction'
  | 'logIndex'
  | 'transactionHash'
> & {
  amount: string
  blockNumber?: number
  timestamp?: number
}

type DepositDirection = {
  direction: MessageDirection.L1_TO_L2
}

type BtcTransactionHash = {
  transactionHash: BtcTransaction
}

type EvmTransactionHash = {
  transactionHash: Hash
}

type WithdrawDirection = {
  direction: MessageDirection.L2_TO_L1
}

export type BtcDepositOperation = CommonOperation &
  DepositDirection &
  BtcTransactionHash & {
    status: BtcDepositStatus
  } & {
    l1ChainId: BtcChain['id']
    l2ChainId: Chain['id']
  }
export type EvmDepositOperation = CommonOperation &
  DepositDirection &
  EvmTransactionHash & {
    l1ChainId: Chain['id']
    l2ChainId: Chain['id']
  }

export type EvmWithdrawOperation = CommonOperation &
  EvmTransactionHash &
  WithdrawDirection & {
    status?: MessageStatus
  } & {
    l1ChainId: RemoteChain['id']
    l2ChainId: Chain['id']
  }

export type DepositTunnelOperation = BtcDepositOperation | EvmDepositOperation

// TODO add BtcWithdrawals https://github.com/hemilabs/ui-monorepo/issues/343
export type WithdrawTunnelOperation = EvmWithdrawOperation

export type TunnelOperation = DepositTunnelOperation | WithdrawTunnelOperation

export type RawTunnelOperation<T extends TunnelOperation> = Omit<T, 'timestamp'>
