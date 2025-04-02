// Copied from webapp/types/tunnel.ts and modified to remove unused types

/* eslint-disable node/no-unpublished-import */

import { type Chain, type Hash } from 'viem'

// Prefer ordering by value instead of keys
/* eslint-disable sort-keys */
// Based on https://sdk.optimism.io/classes/crosschainmessenger#getMessageStatus
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MessageStatus = {
  UNCONFIRMED_L1_TO_L2_MESSAGE: 0,
  FAILED_L1_TO_L2_MESSAGE: 1,
  STATE_ROOT_NOT_PUBLISHED: 2,
  READY_TO_PROVE: 3,
  IN_CHALLENGE_PERIOD: 4,
  READY_FOR_RELAY: 5,
  RELAYED: 6,
} as const
/* eslint-enable sort-keys */

// Convert object key in a type
type MessageStatusType = (typeof MessageStatus)[keyof typeof MessageStatus]

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MessageDirection = {
  L1_TO_L2: 0,
  L2_TO_L1: 1,
} as const

/**
 * The first step for a Bitcoin withdrawal consists of doing a Hemi TX. This sets the state
 * TX_PENDING
 *  The first transaction can fail
 *  |_WITHDRAWAL_FAILED
 *  Or it can be successful, confirming the initiation of the withdrawal.
 *  |_TX_CONFIRMED
 * From here, vault operators should confirm the withdrawal, send the bitcoins and confirm it,
 *      |_WITHDRAWAL_SUCCEEDED
 * However, after the grace period, if there are no news, the withdrawal moves to CHALLENGE_READY
 * where they can reset the withdraw and get the Bitcoin back on hemi, for a new withdrawal.
 *      |_CHALLENGE_READY
 *        |_CHALLENGE_IN_PROGRESS
 *          |_WITHDRAWAL_CHALLENGED
 *          |_CHALLENGE_FAILED
 */
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

type CommonOperation = {
  amount: string
  blockNumber?: number
  from: string
  l1Token: string
  l2Token: string
  timestamp?: number
  to: string
}

type DepositDirection = {
  direction: typeof MessageDirection.L1_TO_L2
}

type EvmTransactionHash = {
  transactionHash: Hash
}

type WithdrawDirection = {
  direction: typeof MessageDirection.L2_TO_L1
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
    status: MessageStatusType
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
