'use client'

import { Card } from 'components/card'
import { Table } from 'components/table'
import { useTranslations } from 'next-intl'
import { useMemo, type ReactNode } from 'react'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

import { useEarnPools } from '../../_hooks/useEarnPools'
import { useEarnTransactions } from '../../_hooks/useEarnTransactions'

import { buildColumns } from './columns'
import { CompactCell } from './compactCell'
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
  const { data: pools } = useEarnPools()

  const columns = useMemo(() => buildColumns({ pools, t }), [pools, t])

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
        cellComponent={CompactCell}
        columns={columns}
        data={transactions}
        loading={isPending}
        // Virtual mode (default) gives sticky header + body scroll out of the
        // box, so a long list of past deposits doesn't push the page height.
        // On small breakpoints the View button moves to the first column so
        // it stays reachable when other cells overflow / wrap.
        priorityColumnIdsOnSmall={['actions']}
        // Matches the 48px row height in the Figma. `<CompactCell>` mirrors
        // the default `<Column>` but with `min-h-12` so the row actually
        // renders at this height (the default cell has `min-h-16` hardcoded).
        rowSize={48}
        skeletonRows={5}
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
