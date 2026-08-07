import { zeroAddress } from 'viem'

import { type EarnTransaction } from '../../../../../app/[locale]/hemi-earn/types'

export const baseTx: EarnTransaction = {
  amountIn: '1000000000000000000',
  amountOut: null,
  asset: zeroAddress,
  automatic: true,
  cancellationRequested: false,
  claimTxHash: null,
  failed: false,
  kind: 'DEPOSIT',
  receiver: zeroAddress,
  recoverTxHash: null,
  requestedAt: '0',
  requestId: '0',
  requestTxHash: `0x${'1'.repeat(64)}`,
  status: 'PENDING',
}

export const claimHash = `0x${'a'.repeat(64)}` as const
export const recoverHash = `0x${'b'.repeat(64)}` as const
