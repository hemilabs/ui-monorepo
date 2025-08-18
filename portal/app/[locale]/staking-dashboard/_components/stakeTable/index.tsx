'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Card } from 'components/card'
import { ErrorBoundary } from 'components/errorBoundary'
import { TxLink } from 'components/txLink'
import { useHemi } from 'hooks/useHemi'
import { useWindowSize } from 'hooks/useWindowSize'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import { StakingPosition } from 'types/stakingDashboard'

import { Amount } from '../amount'
import { Column, ColumnHeader, Header } from '../table'

import { LockupTime } from './lockupTime'
import { NoPositionStaked } from './noPositionStaked'
import { TimeRemaining } from './timeRemaining'

// created here so there's a stable reference between renders when using it
const emptyData = new Array(4).fill(null)

const columnsBuilder = (
  t: ReturnType<typeof useTranslations<'staking-dashboard'>>,
): ColumnDef<StakingPosition>[] => [
  {
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-x-2">
        <ErrorBoundary
          fallback={<span className="text-sm text-neutral-950">-</span>}
        >
          <Amount operation={row.original} />
        </ErrorBoundary>
      </div>
    ),
    header: () => <Header text={t('amount')} />,
    id: 'amount',
    meta: { width: '200px' },
  },
  {
    cell: function ExplorerLink({ row }) {
      const hemi = useHemi()
      return (
        <div className="flex items-center">
          <TxLink chainId={hemi.id} txHash={row.original.transactionHash} />
        </div>
      )
    },
    header: () => <Header text={t('table.tx')} />,
    id: 'tx',
    meta: { width: '150px' },
  },
  {
    // TODO define apy - using a hardcoded value for the time being
    cell: () => <span className="text-emerald-600">9.8</span>,
    header: () => <Header text={t('table.apy')} />,
    id: 'apy',
    meta: { width: '42px' },
  },
  {
    cell: ({ row }) => (
      <ErrorBoundary
        fallback={<span className="text-sm text-neutral-950">-</span>}
      >
        <LockupTime lockupTime={row.original.lockTime} />
      </ErrorBoundary>
    ),
    header: () => <Header text={t('lockup-period')} />,
    id: 'lockup-period',
    meta: { width: '120px' },
  },
  {
    cell: ({ row }) => <TimeRemaining operation={row.original} />,
    header: () => <Header text={t('table.time-remaining')} />,
    id: 'time-remaining',
    meta: { width: '170px' },
  },
]

type StakeTableImpProps = {
  data: StakingPosition[] | undefined
  loading: boolean
}

const StakeTableImp = function ({ data = [], loading }: StakeTableImpProps) {
  const t = useTranslations('staking-dashboard')
  const { width } = useWindowSize()

  const columns = useMemo(
    () =>
      columnsBuilder(t).map(c =>
        data.length === 0 && loading
          ? {
              ...c,
              cell: () => <Skeleton className="w-16" />,
            }
          : c,
      ),
    [data.length, loading, t],
  )

  const table = useReactTable({
    columns,
    data: data.length === 0 ? emptyData : data,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnOrder:
        // move "time-remaining" to the left in small devices
        // and keep original order in larger devices
        width < 1024
          ? ['time-remaining'].concat(
              columns.map(c => c.id).filter(id => id !== 'time-remaining'),
            )
          : undefined,
    },
  })

  const { rows } = table.getRowModel()

  return (
    <table className="w-full border-separate border-spacing-0 whitespace-nowrap">
      <thead className="sticky top-0 z-10">
        {table.getHeaderGroups().map(headerGroup => (
          <tr className="flex w-full items-center" key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <ColumnHeader
                className="justify-start"
                key={header.id}
                style={{ width: header.column.columnDef.meta?.width }}
              >
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )}
              </ColumnHeader>
            ))}
          </tr>
        ))}
      </thead>
      <tbody className="relative">
        {rows.map(row => (
          <tr className="group/stake-row flex items-center" key={row.id}>
            {row.getVisibleCells().map(cell => (
              <Column
                className="justify-start"
                key={cell.id}
                style={{ width: cell.column.columnDef.meta?.width }}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </Column>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

type Props = {
  data: StakingPosition[] | undefined
  loading: boolean
}

export const StakeTable = function ({ data, loading }: Props) {
  const isEmpty = data?.length === 0 && !loading

  return (
    <div className="w-full rounded-2xl bg-neutral-100 text-sm font-medium">
      <Card>
        <div
          className={`md:min-h-128 h-[47dvh] overflow-x-auto p-2 ${
            isEmpty ? 'flex items-center justify-center' : ''
          }`}
          style={{
            scrollbarColor: '#d4d4d4 transparent',
            scrollbarWidth: 'thin',
          }}
        >
          {isEmpty ? (
            <NoPositionStaked />
          ) : (
            <StakeTableImp data={data} loading={loading} />
          )}
        </div>
      </Card>
    </div>
  )
}
