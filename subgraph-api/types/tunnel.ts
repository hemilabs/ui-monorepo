// Copied from webapp/types/tunnel.ts and modified to remove unused types

/* eslint-disable node/no-unpublished-import */

import {
  type TokenBridgeMessage,
  type MessageDirection,
  type MessageStatus,
} from '@eth-optimism/sdk'
import { type Chain, type Hash } from 'viem'

const enum BtcWithdrawStatus {
  // The user has confirmed the TX in their wallet, but it hasn't been included in a block
  INITIATE_WITHDRAW_PENDING = 0,
  // Transaction withdraw confirmed
  INITIATE_WITHDRAW_CONFIRMED = 1,
  // The challenge period is over without the operator having completed the withdrawal
  READY_TO_CHALLENGE = 2,
  // The challenge is in progress
  CHALLENGE_IN_PROGRESS = 3,
  // Withdrawal completed
  WITHDRAWAL_SUCCEEDED = 4,
  // Withdrawal challenged
  WITHDRAWAL_CHALLENGED = 5,
  // The withdrawal flow failed
  WITHDRAWAL_FAILED = 6,
  // The challenge transaction failed
  CHALLENGE_FAILED = 7,
}

const enum EvmDepositStatus {
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

type EvmTransactionHash = {
  transactionHash: Hash
}

type WithdrawDirection = {
  direction: MessageDirection.L2_TO_L1
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
    l1ChainId: Chain['id'] // Changed to avoid importing btc-wallet types
    l2ChainId: Chain['id']
  } & {
    challengeTxHash?: Hash
    status: BtcWithdrawStatus
    uuid?: string // bigint can't be serialized into local storage
  }
