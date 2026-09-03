import { Table } from 'components/table'
import { TableCard } from 'components/table/tableCard'
import { useMemo } from 'react'
import { screenBreakpoints } from 'styles'
import { useTranslations } from 'use-intl'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

import { useEarnTransactions } from '../../_hooks/useEarnTransactions'

import { buildColumns } from './columns'
import { CompactColumn } from './compactColumn'
import { ConnectWallet } from './connectWallet'
import { NoTransactions } from './noTransactions'
import { TransactionDrawer } from './transactionDrawer'

export const TransactionsTable = function () {
  const t = useTranslations('hemi-earn.transactions')
  const { status } = useAccount()
  const { data: transactions, isPending } = useEarnTransactions()

  const columns = useMemo(() => buildColumns({ t }), [t])

  const isEmpty = transactions.length === 0 && !isPending

  const content = (function () {
    if (!walletIsConnected(status)) {
      return (
        <TableCard>
          <ConnectWallet />
        </TableCard>
      )
    }
    if (isEmpty) {
      return (
        <TableCard>
          <NoTransactions />
        </TableCard>
      )
    }
    return (
      <Table
        cellComponent={CompactColumn}
        columns={columns}
        containerClassName="flex h-full flex-col"
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
    <div className="w-full text-sm font-medium">
      <div className="h-90">{content}</div>
      <TransactionDrawer />
    </div>
  )
}
