'use client'

import { MessageStatus } from '@eth-optimism/sdk'
import {
  ColumnDef,
  Row,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ConnectWallet } from 'components/connectWallet'
import { useConnectedToSupportedEvmChain } from 'hooks/useConnectedToSupportedChain'
import { useConnectedToUnsupportedEvmChain } from 'hooks/useConnectedToUnsupportedChain'
import { useHemi } from 'hooks/useHemi'
import { useNetworks } from 'hooks/useNetworks'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useTranslations } from 'next-intl'
import { parseAsString, useQueryState } from 'nuqs'
import { useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import {
  BtcDepositStatus,
  DepositTunnelOperation,
  TunnelOperation,
  WithdrawTunnelOperation,
} from 'types/tunnel'
import { Card } from 'ui-common/components/card'
import { useWindowSize } from 'ui-common/hooks/useWindowSize'
import {
  isBtcDeposit,
  isDeposit,
  isToEvmWithdraw,
  isWithdraw,
} from 'utils/tunnel'
import { Chain } from 'viem'
import { useAccount } from 'wagmi'

import { Amount } from './amount'
import { Chain as ChainComponent } from './chain'
import { DepositAction } from './depositAction'
import { Paginator } from './paginator'
import { ReloadHistory } from './reloadHistory'
import { TxLink } from './txLink'
import { TxStatus } from './txStatus'
import { TxTime } from './txTime'
import { WithdrawAction } from './withdrawAction'

const DepositStatus = function ({
  deposit,
}: {
  deposit: DepositTunnelOperation
}) {
  const t = useTranslations()

  if (!isBtcDeposit(deposit)) {
    // Evm deposits are always successful if listed
    return <TxStatus.Success />
  }
  const statuses = {
    [BtcDepositStatus.TX_PENDING]: (
      <TxStatus.InStatus
        text={t('transaction-history.waiting-btc-confirmation')}
      />
    ),
    [BtcDepositStatus.TX_CONFIRMED]: (
      <TxStatus.InStatus text={t('common.wait-hours', { hours: 2 })} />
    ),
    [BtcDepositStatus.BTC_READY_CLAIM]: (
      <TxStatus.InStatus text={t('transaction-history.ready-to-claim')} />
    ),
    [BtcDepositStatus.BTC_DEPOSITED]: <TxStatus.Success />,
  }

  return statuses[deposit.status] ?? '-'
}

const WithdrawStatus = function ({
  withdrawal,
}: {
  withdrawal: WithdrawTunnelOperation
}) {
  const t = useTranslations()
  const waitMinutes = t('common.wait-minutes', { minutes: 20 })

  if (!isToEvmWithdraw(withdrawal)) {
    // Bitcoin withdrawals are always successful if tx was confirmed
    return <TxStatus.Success />
  }

  const statuses = {
    // This status should never be rendered, but just to be defensive
    // let's render the next status:
    [MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE]: (
      <TxStatus.InStatus text={waitMinutes} />
    ),
    [MessageStatus.FAILED_L1_TO_L2_MESSAGE]: <TxStatus.Failed />,
    [MessageStatus.STATE_ROOT_NOT_PUBLISHED]: (
      <TxStatus.InStatus text={waitMinutes} />
    ),
    [MessageStatus.READY_TO_PROVE]: (
      <TxStatus.InStatus text={t('transaction-history.ready-to-prove')} />
    ),
    [MessageStatus.IN_CHALLENGE_PERIOD]: (
      <TxStatus.InStatus text={t('transaction-history.in-challenge-period')} />
    ),
    [MessageStatus.READY_FOR_RELAY]: (
      <TxStatus.InStatus text={t('transaction-history.ready-to-claim')} />
    ),
    [MessageStatus.RELAYED]: <TxStatus.Success />,
  }

  return statuses[withdrawal.status]
}

const Header = ({ text }: { text?: string }) => (
  <span className="block px-2 text-left text-sm font-medium text-neutral-400">
    {text}
  </span>
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
      <span className="text-sm font-normal">
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
    cell: ({ row }) =>
      isDeposit(row.original) ? (
        <DepositAction deposit={row.original} />
      ) : (
        <WithdrawAction withdraw={row.original} />
      ),
    header: () => <ReloadHistory />,
    id: 'action',
  },
]

const useTransactionsHistory = function () {
  const { deposits, syncStatus, withdrawals } = useTunnelHistory()

  const data = useMemo(
    () =>
      ([] as TunnelOperation[])
        .concat(deposits)
        .concat(withdrawals)
        .sort(function (a, b) {
          if (!a.timestamp) {
            return -1
          }
          if (!b.timestamp) {
            return 1
          }
          return b.timestamp - a.timestamp
        }),
    [deposits, withdrawals],
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
              <td className="px-2 py-2" key={c.id || i}>
                {/* @ts-expect-error it works */}
                {c.cell()}
              </td>
            ))}
          </tr>
        ))}
      {(!loading || rows.length > 0) && (
        <>
          {rows.length === 0 && (
            <tr>
              <td
                className="px-2 py-2 text-center text-neutral-700"
                colSpan={columns.length}
              >
                {t('no-transactions')}
              </td>
            </tr>
          )}
          {rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td
                  className={`px-2 py-2 text-neutral-700 ${
                    cell.column.columnDef.id === 'action' ? 'text-center' : ''
                  }`}
                  key={cell.id}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </>
      )}
    </tbody>
  )
}

export const TransactionHistory = function () {
  const { evmRemoteNetworks } = useNetworks()
  // See https://github.com/hemilabs/ui-monorepo/issues/158
  const l1ChainId = evmRemoteNetworks[0].id

  const { status } = useAccount()

  const { data, loading } = useTransactionsHistory()

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
        <>
          <Card borderColor="gray" padding="medium" radius="large">
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id}>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <Body columns={columns} loading={loading} rows={rows} />
              </table>
            </div>
          </Card>
          {pageCount > 1 && (
            <Paginator
              onPageChange={page => setPageIndexFromUrl(page.toString())}
              pageCount={pageCount}
              pageIndex={pageIndex}
              windowSize={width}
            />
          )}
        </>
      )}
      {status === 'connecting' && <Skeleton className="h-4/5 w-full" />}
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
    </>
  )
}
