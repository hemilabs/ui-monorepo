'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Card } from 'components/card'
import { ErrorBoundary } from 'components/errorBoundary'
import { useWindowSize } from 'hooks/useWindowSize'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import { StakingPosition } from 'types/stakingDashboard'

import { Column, ColumnHeader, Header } from '../table'

import { CircularProgress } from './circularProgress'
import { NoPositionStaked } from './noPositionStaked'

// created here so there's a stable reference between renders when using it
const emptyData = new Array(4).fill(null)

const columnsBuilder = (
  t: ReturnType<typeof useTranslations<'staking-dashboard'>>,
): ColumnDef<StakingPosition>[] => [
  {
    cell: () => (
      <div className="flex items-center justify-center gap-x-2">
        <ErrorBoundary
          fallback={<span className="text-sm text-neutral-950">-</span>}
        >
          {/* TODO - Check if the amount component is still needed, otherwise we should drop it */}
          <span>1</span>
        </ErrorBoundary>
      </div>
    ),
    header: () => <Header text={t('amount')} />,
    id: 'amount',
    meta: { className: 'justify-start', width: '200px' },
  },
  {
    cell: () => <div className="flex items-center justify-end">0xabc</div>,
    header: () => (
      <div className="mr-8">
        <Header text={t('table.tx')} />
      </div>
    ),
    id: 'tx',
    meta: { width: '180px' },
  },
  {
    cell: () => <span className="text-emerald-600">9.8</span>,
    header: () => <Header text={t('table.apy')} />,
    id: 'apy',
    meta: { width: '42px' },
  },
  {
    cell: () => <span className="text-neutral-500">12</span>,
    header: () => <Header text={t('lockup-period')} />,
    id: 'lockup-period',
    meta: { width: '140px' },
  },
  {
    cell: () => (
      <div className="flex items-center justify-end gap-x-2">
        <CircularProgress percentage={10} />
        <span className="text-neutral-950">10</span>
      </div>
    ),
    header: () => <Header text={t('table.time-remaining')} />,
    id: 'time-remaining',
    meta: { width: '140px' },
  },
]

type StakeTableImpProps = {
  data: StakingPosition[]
  loading: boolean
}

const StakeTableImp = function ({ data, loading }: StakeTableImpProps) {
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
                className={
                  header.column.columnDef.meta?.className ?? 'justify-end'
                }
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
                className={
                  cell.column.columnDef.meta?.className ?? 'justify-end'
                }
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
  data: StakingPosition[]
  loading: boolean
}

export const StakeTable = function ({ data, loading }: Props) {
  const isEmpty = data.length === 0 && !loading

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
