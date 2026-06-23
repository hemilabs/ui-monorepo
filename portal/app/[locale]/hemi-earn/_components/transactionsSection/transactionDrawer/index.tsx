'use client'

import { Drawer } from 'components/drawer'
import { Suspense } from 'react'
import { isAddressEqual } from 'viem'

import { useEarnPools } from '../../../_hooks/useEarnPools'
import { useEarnTransactions } from '../../../_hooks/useEarnTransactions'
import {
  canRetryRow,
  findPoolByAsset,
  hashesMatch,
  needsManualClaim,
  needsRecover,
} from '../../../_utils'
import {
  type EarnAsset,
  type EarnPool,
  type EarnTransaction,
} from '../../../types'

import { HistoricalDepositReview } from './historicalDepositReview'
import { HistoricalWithdrawReview } from './historicalWithdrawReview'
import { RetryFailedDeposit } from './retryFailedDeposit'
import { RetryFailedWithdraw } from './retryFailedWithdraw'
import { ClaimDeposit, RecoverDeposit } from './settleDeposit'
import { ClaimRedeem, RecoverRedeem } from './settleRedeem'
import { AddTokenToWalletCta } from './settleShared'
import { useTxDrawerQueryString } from './useTxDrawerQueryString'

// The drawer is already open, so the deposit CTAs don't redirect on sign. A
// `failedKind` (the user's claim/recover Hemi tx reverted) surfaces the CTA as
// a Retry even though the subgraph status no longer matches.
function depositCallToAction({
  asset,
  failedKind,
  pool,
  transaction,
}: {
  asset: EarnAsset
  failedKind: 'CLAIM' | 'RECOVER' | undefined
  pool: EarnPool
  transaction: EarnTransaction
}) {
  if (canRetryRow(transaction)) {
    return (
      <RetryFailedDeposit asset={asset} pool={pool} transaction={transaction} />
    )
  }
  if (needsManualClaim(transaction) || failedKind === 'CLAIM') {
    return <ClaimDeposit asset={asset} pool={pool} transaction={transaction} />
  }
  if (needsRecover(transaction) || failedKind === 'RECOVER') {
    return (
      <RecoverDeposit asset={asset} pool={pool} transaction={transaction} />
    )
  }
  // Shares have landed (claim done) — offer to add the share token to the
  // wallet, matching the live drawer and the tunnel history.
  if (transaction.status === 'FINALIZED') {
    return <AddTokenToWalletCta token={pool.shareToken} />
  }
  return null
}

// Mirror of `depositCallToAction` for redeem: claim delivers the underlying
// asset, recover returns the shares.
function redeemCallToAction({
  asset,
  failedKind,
  pool,
  transaction,
}: {
  asset: EarnAsset
  failedKind: 'CLAIM' | 'RECOVER' | undefined
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
  if (needsManualClaim(transaction) || failedKind === 'CLAIM') {
    return <ClaimRedeem asset={asset} pool={pool} transaction={transaction} />
  }
  if (needsRecover(transaction) || failedKind === 'RECOVER') {
    return <RecoverRedeem asset={asset} pool={pool} transaction={transaction} />
  }
  // The underlying asset has landed (claim done) — offer to add it to the wallet,
  // matching the live drawer and the tunnel history.
  if (transaction.status === 'FINALIZED') {
    return <AddTokenToWalletCta token={asset.token} />
  }
  return null
}

const findTransactionByTxId = (transactions: EarnTransaction[], txId: string) =>
  transactions.find(t => hashesMatch(t.requestTxHash, txId))

const TransactionDrawerContent = function () {
  const [txId, setTxDrawerQueryString] = useTxDrawerQueryString()
  const { data: transactions } = useEarnTransactions()
  const { data: pools } = useEarnPools()

  if (!txId) {
    return null
  }

  const close = () => setTxDrawerQueryString(null)
  const transaction = findTransactionByTxId(transactions, txId)

  if (!transaction) {
    return (
      <Drawer onClose={close}>
        <div className="drawer-content" />
      </Drawer>
    )
  }

  const pool = findPoolByAsset(pools, transaction.asset)
  const asset = pool?.assets.find(a =>
    isAddressEqual(a.address, transaction.asset),
  )
  if (!pool || !asset) {
    return (
      <Drawer onClose={close}>
        <div className="drawer-content" />
      </Drawer>
    )
  }
  const resolved = { asset, pool }
  const { settlement } = transaction
  const failedKind = settlement?.failed ? settlement.kind : undefined

  const callToAction =
    transaction.kind === 'REDEEM'
      ? redeemCallToAction({
          asset: resolved.asset,
          failedKind,
          pool: resolved.pool,
          transaction,
        })
      : depositCallToAction({
          asset: resolved.asset,
          failedKind,
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
