// Copied from https://github.com/hemilabs/ui-monorepo/blob/853f366d/webapp/types/tunnel.ts and modified to remove unused types

import { type Chain, type Hash } from 'viem'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MessageDirection = {
  L1_TO_L2: 0,
  L2_TO_L1: 1,
} as const

type CommonOperation = {
  amount: string
  blockNumber?: number
  from: string
  l1Token: string
  l2Token: string
  timestamp?: number
  to: string | null
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
  }

export type ToEvmWithdrawOperation = CommonOperation &
  EvmTransactionHash &
  WithdrawDirection & {
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
    uuid?: string // bigint can't be serialized into local storage
    netSatsAfterFee: string
  }

export type BtcDepositOperation = {
  blockNumber: string
  depositSats: string
  depositTxId: string
  id: string
  netSatsAfterFee: string
  recipient: string
  timestamp: string
  transactionHash: Hash
  vault: string
}
