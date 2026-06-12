import { type Address, type Hash, getAddress, zeroAddress } from 'viem'

import { type EarnTransaction, type EarnTransactionStatusType } from '../types'

export const earnTransactionsKeyPrefix = ['hemi-earn', 'transactions'] as const

// `receiver` checksum matches `useAccount()` in balance cache keys;
// `asset` stays lowercase to match `tokens.ts`.
const normalizeEarnTransaction = (row: EarnTransaction): EarnTransaction => ({
  ...row,
  receiver: getAddress(row.receiver),
})

// Raw `Request` entity shape from `hemi-earn-requests-subgraph` (Envio).
type SubgraphRequest = {
  amountIn: string
  amountOut: string | null
  asset: string
  automatic: boolean | null
  claimableAt: string | null
  claimTxHash: string | null
  failed: boolean
  failureReason: string | null
  kind: 'DEPOSIT' | 'REDEEM'
  receiver: string
  recoverTxHash: string | null
  requestedAt: string
  requestId: string
  requestTxHash: string
  status: 'PENDING' | 'FULFILLED' | 'FINALIZED' | 'CANCELLED' | 'RECOVERED'
}

// The indexer clears `failed` on `RequestRetried`, so a successful retry
// won't be mis-labeled.
const deriveStatus = (row: SubgraphRequest): EarnTransactionStatusType =>
  row.failed ? 'FAILED' : row.status

const toEarnTransaction = (row: SubgraphRequest): EarnTransaction =>
  normalizeEarnTransaction({
    amountIn: row.amountIn,
    amountOut: row.amountOut,
    asset: row.asset as Address,
    automatic: row.automatic ?? true,
    claimableAt: row.claimableAt,
    claimTxHash: row.claimTxHash as Hash | null,
    kind: row.kind,
    receiver: row.receiver as Address,
    recoverTxHash: row.recoverTxHash as Hash | null,
    requestedAt: row.requestedAt,
    requestId: row.requestId,
    requestTxHash: row.requestTxHash as Hash,
    status: deriveStatus(row),
  })

// TODO(api): swap the mock for a real fetch through the portal-backend
// proxy. The boundary translator `toEarnTransaction` above is the contract
// the proxy response should fulfill.
const MOCK_DELAY_MS = 2000

const buildMockRequests = function (receiver: Address): SubgraphRequest[] {
  const now = Math.floor(Date.now() / 1000)
  const sampleAsset = zeroAddress
  const sampleTxHash =
    '0x0000000000000000000000000000000000000000000000000000000000000000'
  return [
    {
      amountIn: '2500000000000000000',
      amountOut: null,
      asset: sampleAsset,
      automatic: true,
      claimableAt: null,
      claimTxHash: null,
      failed: false,
      failureReason: null,
      kind: 'DEPOSIT',
      receiver,
      recoverTxHash: null,
      requestedAt: String(now - 60 * 5),
      requestId: '7',
      requestTxHash: sampleTxHash,
      status: 'PENDING',
    },
    {
      amountIn: '1000000000000000000',
      amountOut: '1000000000000000000',
      asset: sampleAsset,
      automatic: true,
      claimableAt: String(now - 60 * 60 * 24),
      claimTxHash: sampleTxHash,
      failed: false,
      failureReason: null,
      kind: 'DEPOSIT',
      receiver,
      recoverTxHash: null,
      requestedAt: String(now - 60 * 60 * 6),
      requestId: '6',
      requestTxHash: sampleTxHash,
      status: 'FINALIZED',
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
  return buildMockRequests(account).map(toEarnTransaction)
}
