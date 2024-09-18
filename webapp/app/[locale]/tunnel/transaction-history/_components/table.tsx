import {
  ColumnDef,
  Row,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useHemi } from 'hooks/useHemi'
import { useNetworks } from 'hooks/useNetworks'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { ComponentProps, MutableRefObject, useMemo, useRef } from 'react'
import Skeleton from 'react-loading-skeleton'
import { TunnelOperation } from 'types/tunnel'
import { useWindowSize } from 'ui-common/hooks/useWindowSize'
import {
  getOperationFromDeposit,
  getOperationFromWithdraw,
  isDeposit,
  isWithdraw,
} from 'utils/tunnel'
import { Chain } from 'viem'

import { Amount } from './amount'
import { getCallToActionUrl } from './callToAction'
import { Chain as ChainComponent } from './chain'
import { DepositAction } from './depositAction'
import { DepositStatus } from './depositStatus'
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
  const locale = useLocale()
  const router = useRouter()
  const t = useTranslations('tunnel-page.transaction-history')
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 52,
    getScrollElement: () => containerRef.current,
    overscan: 10,
  })

  const openTransaction = function (tunnelOperation: TunnelOperation) {
    const operation = isDeposit(tunnelOperation)
      ? getOperationFromDeposit(tunnelOperation)
      : getOperationFromWithdraw(tunnelOperation)

    const url = `/${locale}${getCallToActionUrl(
      tunnelOperation.transactionHash,
      operation,
    )}`
    router.push(url)
  }

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

const columnsBuilder = (
  t: ReturnType<typeof useTranslations<'tunnel-page.transaction-history'>>,
  l1ChainId: Chain['id'],
  l2Chain: Chain,
): ColumnDef<TunnelOperation>[] => [
  {
    cell: ({ row }) => <TxTime timestamp={row.original.timestamp} />,
    header: () => <Header text={t('column-headers.time')} />,
    id: 'time',
  },
  {
    accessorKey: 'direction',
    cell: ({ row }) => (
      <span className="text-neutral-950">
        {t(isDeposit(row.original) ? 'deposit' : 'withdraw')}
      </span>
    ),
    header: () => <Header text={t('column-headers.type')} />,
    id: 'type',
  },
  {
    accessorKey: 'amount',
    cell: ({ row }) => <Amount operation={row.original} />,
    header: () => <Header text={t('column-headers.amount')} />,
    id: 'amount',
  },
  {
    cell: ({ row }) => (
      <ChainComponent
        chainId={
          // See https://github.com/hemilabs/ui-monorepo/issues/376
          isWithdraw(row.original)
            ? row.original.l2ChainId ?? l2Chain.id
            : row.original.l1ChainId ?? l1ChainId
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
          // See https://github.com/hemilabs/ui-monorepo/issues/376
          isDeposit(row.original)
            ? row.original.l2ChainId ?? l2Chain.id
            : row.original.l1ChainId ?? l1ChainId
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
      // See https://github.com/hemilabs/ui-monorepo/issues/376
      const chainId = isWithdraw(row.original)
        ? row.original.l2ChainId ?? l2Chain.id
        : row.original.l1ChainId ?? l1ChainId
      return <TxLink chainId={chainId} txHash={transactionHash} />
    },
    header: () => <Header text={t('column-headers.tx-hash')} />,
    id: 'transactionHash',
  },
  {
    accessorKey: 'status',
    cell: ({ row }) =>
      isDeposit(row.original) ? (
        <DepositStatus deposit={row.original} />
      ) : (
        <WithdrawStatus withdrawal={row.original} />
      ),
    header: () => <Header text={t('column-headers.status')} />,
    id: 'status',
  },
  {
    cell: ({ row }) => (
      <div className="max-w-20">
        {isDeposit(row.original) ? (
          <DepositAction deposit={row.original} />
        ) : (
          <WithdrawAction withdraw={row.original} />
        )}
      </div>
    ),
    header: () => <Header text={t('column-headers.action')} />,
    id: 'action',
  },
]

type TableProps = {
  data: TunnelOperation[]
  loading: boolean
}

export const Table = function ({ data, loading }: TableProps) {
  const hemi = useHemi()
  const { evmRemoteNetworks } = useNetworks()
  const containerRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('tunnel-page.transaction-history')
  const { width } = useWindowSize()

  // See https://github.com/hemilabs/ui-monorepo/issues/158
  const l1ChainId = evmRemoteNetworks[0].id

  const columns = useMemo(
    () =>
      columnsBuilder(t, l1ChainId, hemi).map(c =>
        data.length === 0 && loading
          ? {
              ...c,
              cell: () => <Skeleton className="w-24" />,
            }
          : c,
      ),
    [data.length, hemi, loading, t, l1ChainId],
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
