import { ColumnDef } from '@tanstack/react-table'
import { ErrorBoundary } from 'components/errorBoundary'
import { Header } from 'components/table/_components/header'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import type { Vault } from '../../_types'
import { Actions } from '../actions'
import { PoolBalance } from '../poolBalance'
import { PoolData } from '../poolData'

const Fallback = () => <span className="text-sm text-neutral-950">-</span>

export const useGetColumns = function () {
  const t = useTranslations()

  return useMemo(
    () =>
      [
        {
          cell: ({ row }) => (
            <ErrorBoundary fallback={<Fallback />}>
              <PoolData address={row.original.address} />
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
          cell: ({ row }) => <Actions row={row} />,
          header: () => (
            <div className="w-full max-lg:pl-4 lg:pr-4 *:lg:text-right">
              <Header text={t('common.actions')} />
            </div>
          ),
          id: 'actions',
          meta: { width: '350px' },
        },
      ] satisfies ColumnDef<Vault>[],
    [t],
  )
}
