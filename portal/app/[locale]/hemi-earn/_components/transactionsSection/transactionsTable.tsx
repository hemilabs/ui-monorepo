'use client'

import { Card } from 'components/card'
import { Table } from 'components/table'
import { useTranslations } from 'next-intl'
import { useMemo, type ReactNode } from 'react'
import { screenBreakpoints } from 'styles'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

import { useEarnTransactions } from '../../_hooks/useEarnTransactions'

import { buildColumns } from './columns'
import { CompactColumn } from './compactColumn'
import { ConnectWallet } from './connectWallet'
import { NoTransactions } from './noTransactions'
import { TransactionDrawer } from './transactionDrawer'

const Container = ({ children }: { children: ReactNode }) => (
  <div className="h-90 rounded-xl bg-neutral-100 p-1 [&>div]:h-full">
    <Card>{children}</Card>
  </div>
)

export const TransactionsTable = function () {
  const t = useTranslations('hemi-earn.transactions')
  const { status } = useAccount()
  const { data: transactions, isPending } = useEarnTransactions()

  const columns = useMemo(() => buildColumns({ t }), [t])

  const isEmpty = transactions.length === 0 && !isPending

  const content = (function () {
    if (!walletIsConnected(status)) {
      return (
        <Container>
          <ConnectWallet />
        </Container>
      )
    }
    if (isEmpty) {
      return (
        <Container>
          <NoTransactions />
        </Container>
      )
    }
    return (
      <Table
        cellComponent={CompactColumn}
        columns={columns}
        data={transactions}
        loading={isPending}
        // Virtual mode: sticky header + body scroll so a long list doesn't grow the page.
        // Mobile column order (designer): Actions, Status, Type, Amount, Date.
        priorityColumnIdsOnSmall={[
          'actions',
          'status',
          'type',
          'amount',
          'date',
        ]}
        rowSize={48}
        skeletonRows={5}
        // Desktop layout from md up; the compact reordered layout is mobile-only.
        smallBreakpoint={screenBreakpoints.md}
      />
    )
  })()

  return (
    <div className="w-full rounded-xl bg-neutral-100 text-sm font-medium">
      <div className="h-90 overflow-hidden">{content}</div>
      <TransactionDrawer />
    </div>
  )
}
