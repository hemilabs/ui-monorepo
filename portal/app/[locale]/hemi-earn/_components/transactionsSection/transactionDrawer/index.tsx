'use client'

import { Drawer } from 'components/drawer'
import { Suspense } from 'react'
import { isAddressEqual } from 'viem'

import { useEarnPools } from '../../../_hooks/useEarnPools'
import { useEarnTransactions } from '../../../_hooks/useEarnTransactions'
import { findPoolByAsset, hashesMatch } from '../../../_utils'
import { type EarnTransaction } from '../../../types'

import { HistoricalDepositReview } from './historicalDepositReview'
import { RetryFailedDeposit } from './retryFailedDeposit'
import { useTxDrawerQueryString } from './useTxDrawerQueryString'

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

  const callToAction =
    transaction.status === 'FAILED' ? (
      <RetryFailedDeposit
        asset={resolved.asset}
        pool={resolved.pool}
        transaction={transaction}
      />
    ) : undefined

  return (
    <Drawer onClose={close}>
      <div className="drawer-content h-[80dvh] md:h-full">
        <HistoricalDepositReview
          callToAction={callToAction}
          onClose={close}
          token={resolved.asset.token}
          transaction={transaction}
        />
      </div>
    </Drawer>
  )
}

export const TransactionDrawer = () => (
  <Suspense>
    <TransactionDrawerContent />
  </Suspense>
)
