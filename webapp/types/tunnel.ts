import {
  type TokenBridgeMessage,
  type MessageDirection,
  type MessageStatus,
} from '@eth-optimism/sdk'
import { BtcChain } from 'btc-wallet/chains'
import { BtcTransaction } from 'btc-wallet/unisat'
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
  // Deposit tx reverted
  DEPOSIT_TX_FAILED = 4,
}

export const enum BtcWithdrawStatus {
  // The user has confirmed the TX in their wallet, but it hasn't been included in a block
  TX_PENDING = 0,
  // Transaction withdraw confirmed
  TX_CONFIRMED = 1,
  // TODO confirm these below are correct
  READY_CHALLENGE = 2,
  WITHDRAWN = 3,
  WITHDRAWAL_FAILED = 4,
}

export const enum EvmDepositStatus {
  // Only used for ERC20 deposits that require an approval. Otherwise, start on ${DEPOSIT_TX_PENDING}
  APPROVAL_TX_PENDING = 0,
  // Once the Approval TX is confirmed, but the user hasn't sent the Deposit Transaction
  APPROVAL_TX_COMPLETED = 1,
  // The user has confirmed the TX in their wallet, but it hasn't been included in a block
  DEPOSIT_TX_PENDING = 2,
  // Transaction deposit confirmed
  DEPOSIT_TX_CONFIRMED = 3,
  // Deposit tx reverted
  DEPOSIT_TX_FAILED = 4,
  // Approval failed
  APPROVAL_TX_FAILED = 5,
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
  confirmationTransactionHash?: Hash
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
    approvalTxHash?: Hash // only used for ERC20 deposits
    l1ChainId: Chain['id']
    l2ChainId: Chain['id']
    status?: EvmDepositStatus // If undefined, assume completed
  }

export type ToEvmWithdrawOperation = CommonOperation &
  EvmTransactionHash &
  WithdrawDirection & {
    status: MessageStatus
  } & {
    l1ChainId: Chain['id']
    l2ChainId: Chain['id']
  } & {
    claimTxHash?: Hash
    proveTxHash?: Hash
  }

export type ToBtcWithdrawOperation = CommonOperation &
  EvmTransactionHash &
  WithdrawDirection & {
    l1ChainId: BtcChain['id']
    l2ChainId: Chain['id']
  } & {
    status: BtcWithdrawStatus
  }

export type DepositTunnelOperation = BtcDepositOperation | EvmDepositOperation

export type WithdrawTunnelOperation =
  | ToEvmWithdrawOperation
  | ToBtcWithdrawOperation

export type TunnelOperation = DepositTunnelOperation | WithdrawTunnelOperation

export type RawTunnelOperation<T extends TunnelOperation> = Omit<T, 'timestamp'>
