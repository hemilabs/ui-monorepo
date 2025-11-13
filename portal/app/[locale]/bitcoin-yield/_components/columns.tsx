import { ColumnDef } from '@tanstack/react-table'
import { ErrorBoundary } from 'components/errorBoundary'
import { Header } from 'components/table/_components/header'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { Address } from 'viem'

import { Actions } from '../_components/actions'
import { PoolBalance } from '../_components/poolBalance'
import { PoolData } from '../_components/poolData'

const Fallback = () => <span className="text-sm text-neutral-950">-</span>

export const useGetColumns = function () {
  const t = useTranslations()

  return useMemo(
    () =>
      [
        {
          cell: ({ row }) => (
            <ErrorBoundary fallback={<Fallback />}>
              <PoolData address={row.original} />
            </ErrorBoundary>
          ),
          header: () => <Header text={t('bitcoin-yield.table.pool')} />,
          id: 'pool',
          meta: { width: '200px' },
        },
        {
          cell: () => (
            <ErrorBoundary fallback={<Fallback />}>
              <PoolBalance />
            </ErrorBoundary>
          ),
          header: () => <Header text={t('common.balance')} />,
          id: 'balance',
          meta: { width: '200px' },
        },
        {
          cell: () => <span>-</span>,
          header: () => <Header text={t('bitcoin-yield.table.rewards')} />,
          id: 'rewards',
          meta: { width: '200px' },
        },
        {
          cell: () => <Actions />,
          header: () => <Header text={t('common.actions')} />,
          id: 'actions',
          meta: { width: '350px' },
        },
      ] satisfies ColumnDef<Address>[],
    [t],
  )
}
