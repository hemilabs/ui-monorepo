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
  claimTransactionHash?: Hash
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
