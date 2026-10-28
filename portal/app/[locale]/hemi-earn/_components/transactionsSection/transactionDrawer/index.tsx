import { Drawer } from 'components/drawer'
import { Suspense, useEffect } from 'react'
import { isAddressEqual, isHash } from 'viem'

import { useEarnPools } from '../../../_hooks/useEarnVaults'
import { useEarnTransactions } from '../../../_hooks/useEarnTransactions'
import { hashesMatch } from '../../../_utils/hashes'
import { findPoolByAsset } from '../../../_utils/vaults'
import {
  canRetryRow,
  isAwaitingFinalize,
  isRemoteFailed,
  needsManualClaim,
  needsRecover,
} from '../../../_utils/transactionPredicates'
import {
  type EarnAsset,
  type EarnPool,
  type EarnTransaction,
} from '../../../types'

import { ClaimFromVaultCta } from './claimFromVault'
import { HistoricalDepositReview } from './historicalDepositReview'
import { HistoricalWithdrawReview } from './historicalWithdrawReview'
import { RemoteFailedCta } from './remoteFailed'
import { RetryFailedDeposit } from './retryFailedDeposit'
import { RetryFailedWithdraw } from './retryFailedWithdraw'
import { AddTokenToWalletCta, SettleCta } from './settleShared'
import { TransactionDrawerSkeleton } from './transactionDrawerSkeleton'
import { TransactionNotFound } from './transactionNotFound'
import { TransactionUnavailable } from './transactionUnavailable'
import { useTxDrawerQueryString } from './useTxDrawerQueryString'

// Drawer's already open, so no redirect on sign. A reverted claim/recover stays at
// FULFILLED/CANCELLED, re-surfacing the same CTA (as "try again").
function depositCallToAction({
  asset,
  pool,
  transaction,
}: {
  asset: EarnAsset
  pool: EarnPool
  transaction: EarnTransaction
}) {
  if (canRetryRow(transaction)) {
    return (
      <RetryFailedDeposit asset={asset} pool={pool} transaction={transaction} />
    )
  }
  if (isRemoteFailed(transaction)) {
    return <RemoteFailedCta transaction={transaction} />
  }
  if (needsManualClaim(transaction)) {
    return (
      <SettleCta
        asset={asset}
        operation="CLAIM"
        pool={pool}
        transaction={transaction}
      />
    )
  }
  if (needsRecover(transaction)) {
    return (
      <SettleCta
        asset={asset}
        operation="RECOVER"
        pool={pool}
        transaction={transaction}
      />
    )
  }
  // Claim done — offer to add the share token to the wallet.
  if (transaction.status === 'FINALIZED') {
    return <AddTokenToWalletCta token={pool.shareToken} />
  }
  return null
}

// Redeem mirror: claim delivers the asset, recover returns the shares.
function redeemCallToAction({
  asset,
  pool,
  transaction,
}: {
  asset: EarnAsset
  pool: EarnPool
  transaction: EarnTransaction
}) {
  if (canRetryRow(transaction)) {
    return (
      <RetryFailedWithdraw
        asset={asset}
        pool={pool}
        transaction={transaction}
      />
    )
  }
  if (isRemoteFailed(transaction)) {
    return <RemoteFailedCta transaction={transaction} />
  }
  if (isAwaitingFinalize(transaction)) {
    return <ClaimFromVaultCta transaction={transaction} />
  }
  if (needsManualClaim(transaction)) {
    return (
      <SettleCta
        asset={asset}
        operation="CLAIM"
        pool={pool}
        transaction={transaction}
      />
    )
  }
  if (needsRecover(transaction)) {
    return (
      <SettleCta
        asset={asset}
        operation="RECOVER"
        pool={pool}
        transaction={transaction}
      />
    )
  }
  // Claim done — offer to add the asset to the wallet.
  if (transaction.status === 'FINALIZED') {
    return <AddTokenToWalletCta token={asset.token} />
  }
  return null
}

const findTransactionByTxId = (transactions: EarnTransaction[], txId: string) =>
  transactions.find(t => hashesMatch(t.requestTxHash, txId))

const resolveDrawerData = function ({
  pools,
  transactions,
  txId,
}: {
  pools: EarnPool[]
  transactions: EarnTransaction[]
  txId: string
}) {
  const transaction = findTransactionByTxId(transactions, txId)
  if (!transaction) {
    return undefined
  }
  const pool = findPoolByAsset(pools, transaction.asset)
  const asset = pool?.assets.find(a =>
    isAddressEqual(a.address, transaction.asset),
  )
  if (!pool || !asset) {
    return undefined
  }
  return { asset, pool, transaction }
}

const UnresolvedTransaction = function ({
  hasLoadError,
  isLoading,
  onClose,
  onRetry,
}: {
  hasLoadError: boolean
  isLoading: boolean
  onClose: VoidFunction
  onRetry: VoidFunction
}) {
  if (hasLoadError) {
    return <TransactionUnavailable onClose={onClose} onRetry={onRetry} />
  }
  if (isLoading) {
    return <TransactionDrawerSkeleton onClose={onClose} />
  }
  return <TransactionNotFound onClose={onClose} />
}

const TransactionDrawerContent = function () {
  const [txId, setTxDrawerQueryString] = useTxDrawerQueryString()
  const {
    data: transactions,
    hasLoadError: hasTransactionsLoadError,
    isPending: isTransactionsPending,
    reset: resetTransactions,
  } = useEarnTransactions()
  const { data: pools } = useEarnPools()

  // A malformed txId (e.g. 0x123) isn't a real tx — drop it from the URL and show no drawer.
  const hasInvalidTxId = txId !== null && !isHash(txId)
  useEffect(
    function clearInvalidTxId() {
      if (hasInvalidTxId) {
        setTxDrawerQueryString(null)
      }
    },
    [hasInvalidTxId, setTxDrawerQueryString],
  )

  if (!txId || hasInvalidTxId) {
    return null
  }

  const close = () => setTxDrawerQueryString(null)

  const resolved = pools && resolveDrawerData({ pools, transactions, txId })
  if (!resolved) {
    return (
      <Drawer onClose={close}>
        <UnresolvedTransaction
          hasLoadError={hasTransactionsLoadError}
          isLoading={!pools || isTransactionsPending}
          onClose={close}
          onRetry={resetTransactions}
        />
      </Drawer>
    )
  }
  const { transaction } = resolved

  const callToAction =
    transaction.kind === 'REDEEM'
      ? redeemCallToAction({
          asset: resolved.asset,
          pool: resolved.pool,
          transaction,
        })
      : depositCallToAction({
          asset: resolved.asset,
          pool: resolved.pool,
          transaction,
        })

  return (
    <Drawer onClose={close}>
      <div className="drawer-content h-[80dvh] md:h-full">
        {transaction.kind === 'REDEEM' ? (
          <HistoricalWithdrawReview
            callToAction={callToAction}
            onClose={close}
            pool={resolved.pool}
            transaction={transaction}
          />
        ) : (
          <HistoricalDepositReview
            callToAction={callToAction}
            onClose={close}
            token={resolved.asset.token}
            transaction={transaction}
          />
        )}
      </div>
    </Drawer>
  )
}

export const TransactionDrawer = () => (
  <Suspense>
    <TransactionDrawerContent />
  </Suspense>
)
