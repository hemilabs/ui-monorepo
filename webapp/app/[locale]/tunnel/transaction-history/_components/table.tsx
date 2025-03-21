import {
  ColumnDef,
  Row,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ErrorBoundary } from 'components/errorBoundary'
import { Arrow } from 'components/icons/arrow'
import { CheckMark } from 'components/icons/checkMark'
import { Chevron } from 'components/icons/chevron'
import { Menu } from 'components/menu'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useWindowSize } from 'hooks/useWindowSize'
import { useTranslations } from 'next-intl'
import { ComponentProps, MutableRefObject, useMemo, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { TunnelOperation } from 'types/tunnel'
import { isDeposit, isWithdraw } from 'utils/tunnel'

import { useTunnelOperation } from '../../_hooks/useTunnelOperation'

import { Amount } from './amount'
import { Chain as ChainComponent } from './chain'
import { DepositAction } from './depositAction'
import { DepositStatus } from './depositStatus'
import { FilterOptions } from './topBar'
import { TxLink } from './txLink'
import { TxTime } from './txTime'
import { WithdrawAction } from './withdrawAction'
import { WithdrawStatus } from './withdrawStatus'

// Note: There's a file "transactionHistory.css" whose imports comes from app/styles/global.css
// with some classes defined there to avoid very long classes definitions in the HTML classNames

const ColumnHeader = ({ className = '', children }: ComponentProps<'th'>) => (
  <th
    className={`border-color-neutral/55 transaction-history-cell ${className} h-8 border-b
    border-t border-solid bg-neutral-50 font-medium first:rounded-l-lg first:border-l last:rounded-r-lg
    last:border-r first:[&>span]:pl-4 last:[&>span]:pl-5`}
  >
    {children}
  </th>
)

const Column = (props: ComponentProps<'td'>) => (
  <td
    className={`h-13 transaction-history-cell cursor-pointer border-b border-solid border-neutral-300/55
    py-2.5 last:pr-2.5 group-hover/history-row:bg-neutral-50 first:[&>*]:pl-4 last:[&>*]:pl-5`}
    {...props}
  />
)

const Header = ({ text }: { text?: string }) => (
  <span className="block py-2 text-left text-neutral-600">{text}</span>
)
const rowSize = 52
const Body = function ({
  columns,
  containerRef,
  loading,
  rows,
}: {
  columns: ColumnDef<TunnelOperation>[]
  containerRef: MutableRefObject<HTMLDivElement>
  loading: boolean
  rows: Row<TunnelOperation>[]
}) {
  const t = useTranslations('tunnel-page.transaction-history')
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => rowSize,
    getScrollElement: () => containerRef.current,
    initialRect: {
      // Estimation to fix the initial render that's broken. See https://github.com/TanStack/virtual/issues/871
      height: rows.length * rowSize,
      // Not relevant, but type mandatory
      width: 0,
    },
    overscan: 10,
  })
  const { updateTxHash } = useTunnelOperation()

  const openTransaction = (tunnelOperation: TunnelOperation) =>
    updateTxHash(tunnelOperation.transactionHash)

  return (
    <tbody
      className="relative"
      style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
    >
      {loading &&
        rows.length === 0 &&
        Array.from(Array(10).keys()).map(index => (
          <tr className="flex items-center" key={index}>
            {columns.map((c, i) => (
              <Column key={c.id || i}>
                {/* @ts-expect-error it works */}
                {c.cell()}
              </Column>
            ))}
          </tr>
        ))}
      {(!loading || rows.length > 0) && (
        <>
          {rows.length === 0 && (
            <tr className="flex items-center">
              <Column colSpan={columns.length}>{t('no-transactions')}</Column>
            </tr>
          )}
          {rowVirtualizer.getVirtualItems().map(function (virtualRow) {
            const row = rows[virtualRow.index] as Row<TunnelOperation>
            return (
              <tr
                className="group/history-row absolute flex w-full items-center"
                data-index={virtualRow.index}
                key={row.id}
                onClick={() => openTransaction(row.original)}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {row.getVisibleCells().map(cell => (
                  <Column key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Column>
                ))}
              </tr>
            )
          })}
        </>
      )}
    </tbody>
  )
}

const TimeHeader = ({
  text,
  filterOption,
  setFilterOption,
}: {
  text: string
  filterOption: FilterOptions
  setFilterOption: (filter: FilterOptions) => void
}) => (
  <span
    className="flex cursor-pointer items-center gap-2"
    onClick={() =>
      setFilterOption({ ...filterOption, timeDesc: !filterOption.timeDesc })
    }
  >
    <Header text={text} />
    <Arrow className={`${filterOption.timeDesc ? '' : 'rotate-180'}`} />
  </span>
)

const TypeHeader = function ({
  t,
  filterOption,
  setFilterOption,
}: {
  t: ReturnType<typeof useTranslations<'tunnel-page.transaction-history'>>
  filterOption: FilterOptions
  setFilterOption: (filter: FilterOptions) => void
}) {
  const types = ['all', 'deposits', 'withdrawals'] as FilterOptions['type'][]
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)

  const closeTypeMenu = () => setShowTypeDropdown(false)
  const ref = useOnClickOutside<HTMLSpanElement>(closeTypeMenu)

  return (
    <span className="flex flex-col" ref={ref}>
      <span
        className="flex cursor-pointer items-center gap-3"
        onClick={() => setShowTypeDropdown(!showTypeDropdown)}
      >
        <Header text={t('column-headers.type')} />
        <Chevron.Bottom className={showTypeDropdown ? 'rotate-180' : ''} />
      </span>
      {showTypeDropdown && (
        <div className="absolute top-9">
          <Menu
            items={types.map(type => ({
              content: (
                <button
                  className="flex items-center gap-x-2"
                  disabled={filterOption.type === type}
                  onClick={function (e) {
                    e.stopPropagation()
                    setFilterOption({ ...filterOption, type })
                  }}
                >
                  <span className="whitespace-nowrap">
                    {t(`filters.types.${type}`)}
                  </span>
                  <div
                    className={
                      filterOption.type === type ? 'block' : 'invisible'
                    }
                  >
                    <CheckMark />
                  </div>
                </button>
              ),
              id: type,
            }))}
          />
        </div>
      )}
    </span>
  )
}

const ActionHeader = function ({
  t,
  filterOption,
  setFilterOption,
}: {
  t: ReturnType<typeof useTranslations<'tunnel-page.transaction-history'>>
  filterOption: FilterOptions
  setFilterOption: (filter: FilterOptions) => void
}) {
  const actions = ['all', 'pending'] as FilterOptions['action'][]
  const [showActionDropdown, setShowActionDropdown] = useState(false)

  const closeActionMenu = () => setShowActionDropdown(false)
  const ref = useOnClickOutside<HTMLSpanElement>(closeActionMenu)

  return (
    <span className="flex flex-col" ref={ref}>
      <span
        className="flex cursor-pointer items-center gap-2"
        onClick={() => setShowActionDropdown(!showActionDropdown)}
      >
        <Header text={t('column-headers.action')} />
        <Chevron.Bottom className={showActionDropdown ? 'rotate-180' : ''} />
      </span>
      {showActionDropdown && (
        <div className="absolute top-9 -ml-5 lg:-ml-12">
          <Menu
            items={actions.map(action => ({
              content: (
                <button
                  className="flex items-center gap-x-2"
                  disabled={filterOption.action === action}
                  onClick={function (e) {
                    e.stopPropagation()
                    setFilterOption({ ...filterOption, action })
                  }}
                >
                  <span className="whitespace-nowrap">
                    {t(`filters.actions.${action}`)}
                  </span>
                  <div
                    className={
                      filterOption.action === action ? 'block' : 'invisible'
                    }
                  >
                    <CheckMark />
                  </div>
                </button>
              ),
              id: action,
            }))}
          />
        </div>
      )}
    </span>
  )
}

const columnsBuilder = (
  t: ReturnType<typeof useTranslations<'tunnel-page.transaction-history'>>,
  filterOption: FilterOptions,
  setFilterOption: (filter: FilterOptions) => void,
): ColumnDef<TunnelOperation>[] => [
  {
    cell: ({ row }) => <TxTime timestamp={row.original.timestamp} />,
    header: () => (
      <TimeHeader
        filterOption={filterOption}
        setFilterOption={setFilterOption}
        text={t('column-headers.time')}
      />
    ),
    id: 'time',
  },
  {
    accessorKey: 'direction',
    cell: ({ row }) => (
      <span className="text-neutral-950">
        {t(isDeposit(row.original) ? 'deposit' : 'withdraw')}
      </span>
    ),
    header: () => (
      <TypeHeader
        filterOption={filterOption}
        setFilterOption={setFilterOption}
        t={t}
      />
    ),
    id: 'type',
  },
  {
    accessorKey: 'amount',
    cell: ({ row }) => (
      <ErrorBoundary
        fallback={<span className="text-sm text-neutral-950">-</span>}
      >
        <Amount operation={row.original} />
      </ErrorBoundary>
    ),
    header: () => <Header text={t('column-headers.amount')} />,
    id: 'amount',
  },
  {
    cell: ({ row }) => (
      <ChainComponent
        chainId={
          isWithdraw(row.original)
            ? row.original.l2ChainId
            : row.original.l1ChainId
        }
      />
    ),
    header: () => <Header text={t('column-headers.from')} />,
    id: 'from',
  },
  {
    cell: ({ row }) => (
      <ChainComponent
        chainId={
          isDeposit(row.original)
            ? row.original.l2ChainId
            : row.original.l1ChainId
        }
      />
    ),
    header: () => <Header text={t('column-headers.to')} />,
    id: 'to',
  },
  {
    accessorKey: 'transactionHash',
    cell({ row }) {
      const { transactionHash } = row.original
      const chainId = isWithdraw(row.original)
        ? row.original.l2ChainId
        : row.original.l1ChainId
      return <TxLink chainId={chainId} txHash={transactionHash} />
    },
    header: () => <Header text={t('column-headers.tx-hash')} />,
    id: 'transactionHash',
  },
  {
    accessorKey: 'status',
    cell: ({ row }) => (
      <div className="w-36 text-wrap 2xl:w-48">
        {isDeposit(row.original) ? (
          <DepositStatus deposit={row.original} />
        ) : (
          <WithdrawStatus withdrawal={row.original} />
        )}
      </div>
    ),
    header: () => <Header text={t('column-headers.status')} />,
    id: 'status',
  },
  {
    cell: ({ row }) => (
      <div className="max-w-24">
        {isDeposit(row.original) ? (
          <DepositAction deposit={row.original} />
        ) : (
          <WithdrawAction withdraw={row.original} />
        )}
      </div>
    ),
    header: () => (
      <ActionHeader
        filterOption={filterOption}
        setFilterOption={setFilterOption}
        t={t}
      />
    ),
    id: 'action',
  },
]

type TableProps = {
  containerRef: MutableRefObject<HTMLDivElement>
  data: TunnelOperation[]
  loading: boolean
  filterOption: FilterOptions
  setFilterOption: (filter: FilterOptions) => void
}

export const Table = function ({
  containerRef,
  data,
  loading,
  filterOption,
  setFilterOption,
}: TableProps) {
  const t = useTranslations('tunnel-page.transaction-history')
  const { width } = useWindowSize()

  const columns = useMemo(
    () =>
      columnsBuilder(t, filterOption, setFilterOption).map(c =>
        data.length === 0 && loading
          ? {
              ...c,
              cell: () => <Skeleton className="w-16" />,
            }
          : c,
      ),
    [data.length, loading, t, filterOption, setFilterOption],
  )

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnOrder:
        // move "action" and "status" to the left in small devices
        // and keep original order in larger devices
        width < 1024
          ? ['action', 'status'].concat(
              columns
                .filter(c => !['action', 'status'].includes(c.id))
                .map(c => c.id),
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
              <ColumnHeader key={header.id}>
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )}
              </ColumnHeader>
            ))}
          </tr>
        ))}
      </thead>
      <Body
        columns={columns}
        containerRef={containerRef}
        loading={loading}
        rows={rows}
      />
    </table>
  )
}
