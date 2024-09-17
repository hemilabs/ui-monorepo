'use client'

import {
  ColumnDef,
  Row,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Card } from 'components/card'
import { ConnectWallet } from 'components/connectWallet'
import { useConnectedToSupportedEvmChain } from 'hooks/useConnectedToSupportedChain'
import { useConnectedToUnsupportedEvmChain } from 'hooks/useConnectedToUnsupportedChain'
import { useHemi } from 'hooks/useHemi'
import { useNetworks } from 'hooks/useNetworks'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useTranslations } from 'next-intl'
import { parseAsString, useQueryState } from 'nuqs'
import { ComponentProps, useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import { TunnelOperation } from 'types/tunnel'
import { useWindowSize } from 'ui-common/hooks/useWindowSize'
import {
  isBtcOperation,
  isEvmOperation,
  isDeposit,
  isWithdraw,
} from 'utils/tunnel'
import { Chain } from 'viem'
import { useAccount } from 'wagmi'

import { Amount } from './amount'
import { Chain as ChainComponent } from './chain'
import { DepositAction } from './depositAction'
import { DepositStatus } from './depositStatus'
import { Paginator } from './paginator'
import { type FilterOptions } from './topBar'
import { TxLink } from './txLink'
import { TxTime } from './txTime'
import { WithdrawAction } from './withdrawAction'
import { WithdrawStatus } from './withdrawStatus'

const columnWidthCss = `first:min-w-15 md:first:min-w-28 [&:nth-child(2)]:min-w-32
  [&:nth-child(3)]:min-w-16 [&:nth-child(4)]:min-w-16 [&:nth-child(5)]:min-w-24 last:min-w-24
  `

const ColumnHeader = ({ className = '', children }: ComponentProps<'th'>) => (
  <th
    className={`border-color-neutral/55 ${className} ${columnWidthCss} h-8 border-b border-t border-solid bg-neutral-50
    font-medium first:rounded-l-lg first:border-l last:rounded-r-lg last:border-r first:[&>span]:pl-4 last:[&>span]:pl-5`}
  >
    {children}
  </th>
)

const Column = (props: ComponentProps<'td'>) => (
  <td
    className={`h-[52px] border-b border-solid border-neutral-300/55
    py-2.5 ${columnWidthCss} last:pr-2.5 first:[&>*]:pl-4 last:[&>*]:pl-5`}
    {...props}
  />
)

const Header = ({ text }: { text?: string }) => (
  <span className="block py-2 text-left text-neutral-600">{text}</span>
)

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

const useTransactionsHistory = function (filter: FilterOptions) {
  const { deposits, syncStatus, withdrawals } = useTunnelHistory()

  const data = useMemo(
    () =>
      ([] as TunnelOperation[])
        .concat(deposits)
        .concat(withdrawals)
        .filter(
          operation =>
            filter === 'all' ||
            (filter === 'bitcoin' && isBtcOperation(operation)) ||
            (filter === 'ethereum' && isEvmOperation(operation)),
        )
        .sort(function (a, b) {
          if (!a.timestamp) {
            return -1
          }
          if (!b.timestamp) {
            return 1
          }
          return b.timestamp - a.timestamp
        }),
    [deposits, filter, withdrawals],
  )
  return {
    data,
    loading: syncStatus === 'syncing',
  }
}

const pageSize = 8

const Body = function ({
  columns,
  loading,
  rows,
}: {
  columns: ColumnDef<TunnelOperation>[]
  loading: boolean
  rows: Row<TunnelOperation>[]
}) {
  const t = useTranslations('tunnel-page.transaction-history')
  return (
    <tbody>
      {loading &&
        rows.length === 0 &&
        Array.from(Array(pageSize).keys()).map(index => (
          <tr key={index}>
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
            <tr>
              <Column colSpan={columns.length}>{t('no-transactions')}</Column>
            </tr>
          )}
          {rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <Column
                  // cell.column.columnDef.id === 'action' ? 'text-center' : ''
                  key={cell.id}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Column>
              ))}
            </tr>
          ))}
        </>
      )}
    </tbody>
  )
}

export const TransactionHistory = function ({
  filterOption,
}: {
  filterOption: FilterOptions
}) {
  const { evmRemoteNetworks } = useNetworks()
  // See https://github.com/hemilabs/ui-monorepo/issues/158
  const l1ChainId = evmRemoteNetworks[0].id

  const { status } = useAccount()
  const { data, loading } = useTransactionsHistory(filterOption)

  const hemi = useHemi()
  const t = useTranslations('tunnel-page.transaction-history')
  const translate = useTranslations()

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

  const { width } = useWindowSize()

  const [pageIndexFromUrl, setPageIndexFromUrl] = useQueryState(
    'pageIndex',
    parseAsString.withDefault('0'),
  )

  // @ts-expect-error isNaN does accept string, TS error it works
  const parsedPageIndex = isNaN(pageIndexFromUrl)
    ? 0
    : // convert negative numbers to 0
      Math.max(parseInt(pageIndexFromUrl), 0)

  // if pageIndex from the URL exceeds the number of pages available, show the last page
  const pageIndex = Math.min(
    parsedPageIndex,
    Math.floor(data.length / pageSize),
  )

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
      pagination: {
        pageIndex,
        pageSize,
      },
    },
  })

  // One is not the opposite of the other, as these consider if the user is connected to the wallet!
  const connectedToSupportedChain = useConnectedToSupportedEvmChain()
  const connectedToUnsupportedChain = useConnectedToUnsupportedEvmChain()

  const pageCount = table.getPageCount()

  const { rows } = table.getRowModel()

  return (
    <>
      {connectedToSupportedChain && (
        <Card>
          <div className="overflow-x-auto p-2">
            <table className="w-full border-separate border-spacing-0 whitespace-nowrap">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
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
              <Body columns={columns} loading={loading} rows={rows} />
            </table>
          </div>
        </Card>
      )}
      {status === 'connecting' && (
        <Skeleton className="h-80 w-full rounded-2xl md:h-[500px]" />
      )}
      {status === 'disconnected' && (
        <ConnectWallet
          heading={translate('common.connect-your-wallet')}
          subheading={translate('transaction-history.connect-wallet-to-review')}
        />
      )}
      {connectedToUnsupportedChain && (
        <ConnectWallet
          heading={translate('common.unsupported-chain-heading')}
          subheading={translate(
            'transaction-history.unsupported-chain-subheading',
          )}
        />
      )}
      {pageCount > 1 && (
        <Paginator
          onPageChange={page => setPageIndexFromUrl(page.toString())}
          pageCount={pageCount}
          pageIndex={pageIndex}
          windowSize={width}
        />
      )}
    </>
  )
}
