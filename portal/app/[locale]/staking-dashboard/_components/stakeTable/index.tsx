'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Button } from 'components/button'
import { Card } from 'components/card'
import { useWindowSize } from 'hooks/useWindowSize'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import { StakingDashboardToken } from 'types/stakingDashboard'

import { VeHemiIcon } from '../../_icons/veHemiIcon'
import { Column, ColumnHeader, Header } from '../table'

import { CircularProgress } from './circularProgress'
import { NoTransactionsMade } from './noTransactionsMade'

// created here so there's a stable reference between renders when using it
const emptyData = new Array(4).fill(null)

const columnsBuilder = (
  t: ReturnType<typeof useTranslations<'staking-dashboard.table'>>,
): ColumnDef<StakingDashboardToken>[] => [
  {
    cell: ({ row }) => (
      <div className="flex items-center justify-center space-x-2">
        <VeHemiIcon />
        <span className="text-neutral-950">{row.original.amount}</span>
      </div>
    ),
    header: () => <Header text={t('amount')} />,
    id: 'amount',
    meta: { width: '200px' },
  },
  {
    cell: ({ row }) => (
      <span className="text-neutral-500">{row.original.transaction}</span>
    ),
    header: () => <Header text={t('tx')} />,
    id: 'tx',
    meta: { width: '120px' },
  },
  {
    cell: ({ row }) => (
      <span className="text-emerald-600">{row.original.apy}</span>
    ),
    header: () => <Header text={t('apy')} />,
    id: 'apy',
    meta: { width: '120px' },
  },
  {
    cell: ({ row }) => (
      <span className="text-neutral-500">{row.original.lockupPeriod}</span>
    ),
    header: () => <Header text={t('lockup-period')} />,
    id: 'lockup-period',
    meta: { width: '120px' },
  },
  {
    cell: ({ row }) => (
      <div className="flex items-center justify-center space-x-2">
        {row.original.percentageRemaining === 0 ? (
          <Button
            size="small"
            //TODO - onClick TBD
          >
            {t('unlock')}
          </Button>
        ) : (
          <>
            <CircularProgress percentage={row.original.percentageRemaining} />
            <span className="text-neutral-950">
              {row.original.timeRemaining}
            </span>
          </>
        )}
      </div>
    ),
    header: () => <Header text={t('time-remaining')} />,
    id: 'time-remaining',
    meta: { width: '120px' },
  },
]

type StakeTableImpProps = {
  data: StakingDashboardToken[]
  loading: boolean
}

const StakeTableImp = function ({ data, loading }: StakeTableImpProps) {
  const t = useTranslations('staking-dashboard.table')
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
  data: StakingDashboardToken[]
  loading: boolean
}

export const StakeTable = function ({ data, loading }: Props) {
  const isEmpty = data.length === 0 && !loading

  return (
    <div className="w-full rounded-2xl bg-neutral-100 text-sm font-medium">
      <Card>
        <div
          className={`min-h-120 max-h-[48dvh] overflow-x-auto p-2 ${
            isEmpty ? 'flex items-center justify-center' : ''
          }`}
          style={{
            scrollbarColor: '#d4d4d4 transparent',
            scrollbarWidth: 'thin',
          }}
        >
          {isEmpty ? (
            <NoTransactionsMade />
          ) : (
            <StakeTableImp data={data} loading={loading} />
          )}
        </div>
      </Card>
    </div>
  )
}
