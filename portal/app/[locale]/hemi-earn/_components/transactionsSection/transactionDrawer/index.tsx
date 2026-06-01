'use client'

import { Drawer } from 'components/drawer'
import { Suspense } from 'react'
import { type Address, isAddressEqual } from 'viem'

import { useEarnPools } from '../../../_hooks/useEarnPools'
import { useEarnTransactions } from '../../../_hooks/useEarnTransactions'
import { type EarnPool, type EarnTransaction } from '../../../types'

import { HistoricalDepositReview } from './historicalDepositReview'
import { RetryFailedDeposit } from './retryFailedDeposit'
import { useTxDrawerQueryString } from './useTxDrawerQueryString'

const findTransactionByTxId = (transactions: EarnTransaction[], txId: string) =>
  transactions.find(t => t.initiateTxHash.toLowerCase() === txId.toLowerCase())

const resolvePoolAndAsset = function (pools: EarnPool[], asset: Address) {
  for (const pool of pools) {
    const match = pool.assets.find(a => isAddressEqual(a.address, asset))
    if (match) return { asset: match, pool }
  }
  return undefined
}

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

  const resolved = resolvePoolAndAsset(pools, transaction.asset)
  if (!resolved) {
    return (
      <Drawer onClose={close}>
        <div className="drawer-content" />
      </Drawer>
    )
  }

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
