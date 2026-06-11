import { type Address, type Hash, getAddress, zeroAddress } from 'viem'

import { type EarnTransaction } from '../types'

export const earnTransactionsKeyPrefix = ['hemi-earn', 'transactions'] as const

// Snap `receiver` to checksum so it matches `useAccount()` in balance
// cache keys; `asset` stays lowercase to match `tokens.ts`.
const normalizeEarnTransaction = (row: EarnTransaction): EarnTransaction => ({
  ...row,
  receiver: getAddress(row.receiver),
})

// TODO(api): replace the mock below with the real GraphQL fetch once the
// indexer API ships (see PR #1946 — `GET /:chainId/earn-requests/:address`
// returns `{ requests: EarnRequestRow[] }` already shaped like
// `EarnTransaction`). Use `fetchQuery` (not `ensureQueryData`) in consumers
// if any chained reads are added (same pitfall hit `fetchEarnPositions` —
// see PR #1942).
const MOCK_DELAY_MS = 2000

const buildMockTransactions = function (receiver: Address): EarnTransaction[] {
  const now = Math.floor(Date.now() / 1000)
  const sampleAsset = zeroAddress
  const sampleTxHash =
    '0x0000000000000000000000000000000000000000000000000000000000000000' as Hash
  return [
    {
      amountIn: '2500000000000000000',
      amountOut: null,
      asset: sampleAsset,
      automatic: true,
      claimTxHash: null,
      initiatedAt: String(now - 60 * 5),
      initiateTxHash: sampleTxHash,
      kind: 'DEPOSIT',
      receiver,
      recoverTxHash: null,
      requestId: '7',
      status: 'PENDING',
    },
    {
      amountIn: '1000000000000000000',
      amountOut: '1000000000000000000',
      asset: sampleAsset,
      automatic: true,
      claimTxHash: sampleTxHash,
      initiatedAt: String(now - 60 * 60 * 6),
      initiateTxHash: sampleTxHash,
      kind: 'DEPOSIT',
      receiver,
      recoverTxHash: null,
      requestId: '6',
      status: 'CLAIMED',
    },
  ]
}

export const fetchEarnTransactions = async function ({
  account,
}: {
  account: Address
  networkType: string
}): Promise<EarnTransaction[]> {
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS))
  return buildMockTransactions(account).map(normalizeEarnTransaction)
}
