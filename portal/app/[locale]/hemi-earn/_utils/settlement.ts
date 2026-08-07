import { type Hash } from 'viem'

import {
  type EarnSettlement,
  type EarnTransaction,
  type LocalEarnOperation,
} from '../types'

import { hashesMatch } from './hashes'

// CANCEL/UNSTAKE/RETRY/CANCEL_REQUEST reuse the settlement field but aren't claim/recover
// txs — strip them so the claim/recover UI never treats them as its own.
export const claimRecoverSettlement = (
  settlement: EarnSettlement | undefined,
) =>
  settlement?.kind === 'CANCEL' ||
  settlement?.kind === 'UNSTAKE' ||
  settlement?.kind === 'RETRY' ||
  settlement?.kind === 'CANCEL_REQUEST'
    ? undefined
    : settlement

export const unstakeSettlement = (settlement: EarnSettlement | undefined) =>
  settlement?.kind === 'UNSTAKE' ? settlement : undefined

export const remoteFailedSettlement = (
  settlement: EarnSettlement | undefined,
) =>
  settlement?.kind === 'RETRY' || settlement?.kind === 'CANCEL_REQUEST'
    ? settlement
    : undefined

// Reads the settlement marker straight from the local store for callers holding a raw (un-enriched) subgraph row.
export const findLocalSettlement = (
  localOperations: LocalEarnOperation[],
  requestTxHash: Hash | undefined,
) =>
  requestTxHash
    ? localOperations.find(
        op =>
          op.initiateTxHash && hashesMatch(op.initiateTxHash, requestTxHash),
      )?.settlement
    : undefined

// Fold the local settlement into a raw row so the CTA can reflect a pending/reverted claim/recover.
export const enrichWithSettlement = (
  row: EarnTransaction | undefined,
  settlement: EarnSettlement | undefined,
) => (row && settlement ? { ...row, settlement } : row)
