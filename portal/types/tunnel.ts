import { BtcChain } from 'btc-wallet/chains'
import { BtcTransaction } from 'btc-wallet/unisat'
import { type Chain, type Hash } from 'viem'

// Prefer ordering by value instead of keys
/* eslint-disable sort-keys */
// Based on https://sdk.optimism.io/classes/crosschainmessenger#getMessageStatus
export const MessageStatus = {
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
export type MessageStatusType =
  (typeof MessageStatus)[keyof typeof MessageStatus]

export const MessageDirection = {
  L1_TO_L2: 0,
  L2_TO_L1: 1,
} as const

/**
 * This enum follows the steps for running a bitcoin deposit. In the ideal flow,
 * the user sends the bitcoin into a bitcoin address controlled by the vault operator.
 * After some time, the vault operator confirms the deposit, and the erc20 bitcoins
 * in Hemi are minted. However, if enough time has passed and the vault operator hasn't confirmed
 * the deposit, the user can confirm it manually on their own, causing the erc20 bitcoins
 * to be mined without the vault operation intervention. Having this in consideration,
 * the flow of state changes for this enum looks like this:
 * BTC_TX_PENDING
 *  |_BTC_TX_FAILED
 *  |_BTC_TX_CONFIRMED
 *   |_BTC_DEPOSITED (Arrives here if vault operator does its work)
 *   |_READY_TO_MANUAL_CONFIRM
 *      |_DEPOSIT_MANUAL_CONFIRMING
 *        |_DEPOSIT_MANUAL_CONFIRMATION_TX_FAILED
 *        |_BTC_DEPOSITED_MANUALLY (Arrives here after manual confirmation)
 */
export const enum BtcDepositStatus {
  // The tx is in the mempool, but hasn't been included in a mined block
  BTC_TX_PENDING = 0,
  // The tx is part of a block that has been mined, but it doesn't have enough
  // confirmations for the erc20 bitcoin to be minted in Hemi
  BTC_TX_CONFIRMED = 1,
  // The vault operator hasn't confirmed the deposit yet. The user can now
  // confirm the deposit manually
  READY_TO_MANUAL_CONFIRM = 2,
  // The user is confirming
  DEPOSIT_MANUAL_CONFIRMING = 3,
  // Deposit tx reverted
  DEPOSIT_MANUAL_CONFIRMATION_TX_FAILED = 4,
  // The erc20 bitcoin version in Hemi has been minted
  BTC_DEPOSITED = 5,
  // The erc20 bitcoin version in Hemi has been minted, after manual confirmation
  BTC_DEPOSITED_MANUALLY = 6,
  // The initial bitcoin transaction failed
  BTC_TX_FAILED = 7,
}

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
export const enum BtcWithdrawStatus {
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
  // Funds have been minted in Hemi
  DEPOSIT_RELAYED = 6,
}

export const ExpectedWaitTimeMinutesGetFundsHemi = 3

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

type BtcTransactionHash = {
  confirmationTransactionHash?: Hash
  transactionHash: BtcTransaction
}

type EvmTransactionHash = {
  transactionHash: Hash
}

type WithdrawDirection = {
  direction: typeof MessageDirection.L2_TO_L1
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
    l2TransactionHash?: Hash // The transaction hash of tokens minted in the L2 chain
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
    l1ChainId: BtcChain['id']
    l2ChainId: Chain['id']
  } & {
    challengeTxHash?: Hash
    status: BtcWithdrawStatus
    uuid?: string // bigint can't be serialized into local storage
  }

export type DepositTunnelOperation = BtcDepositOperation | EvmDepositOperation

export type WithdrawTunnelOperation =
  | ToEvmWithdrawOperation
  | ToBtcWithdrawOperation

export type TunnelOperation = DepositTunnelOperation | WithdrawTunnelOperation

export type RawTunnelOperation<T extends TunnelOperation> = Omit<T, 'timestamp'>
