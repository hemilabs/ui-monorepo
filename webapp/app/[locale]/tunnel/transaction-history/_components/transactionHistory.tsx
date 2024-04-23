'use client'

import { MessageStatus, TokenBridgeMessage } from '@eth-optimism/sdk'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { bridgeableNetworks, hemi } from 'app/networks'
import {
  useAnyChainGetTransactionMessageStatus,
  useGetDepositsByAddress,
  useGetWithdrawalsByAddress,
} from 'hooks/useL2Bridge'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import { Card } from 'ui-common/components/card'
import { Tabs, Tab } from 'ui-common/components/tabs'
import { useWindowSize } from 'ui-common/hooks/useWindowSize'
import { isDeposit } from 'utils/tunnel'
import { Chain } from 'viem'

import { Amount } from './amount'
import { Chain as ChainComponent } from './chain'
import { TxLink } from './txLink'
import { TxStatus } from './txStatus'
import { TxTime } from './txTime'
import { WithdrawAction } from './withdrawAction'

// deposits are always successful if listed
const DepositStatus = () => <TxStatus.Success />

const WithdrawStatus = function ({
  l1ChainId,
  withdrawal,
}: {
  l1ChainId: Chain['id']
  withdrawal: TokenBridgeMessage
}) {
  const t = useTranslations('transaction-history')
  const waitMinutes = useTranslations()(
    'tunnel-page.review-withdraw.wait-minutes',
    { minutes: 20 },
  )
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
      <TxStatus.InStatus text={t('ready-to-prove')} />
    ),
    [MessageStatus.IN_CHALLENGE_PERIOD]: (
      <TxStatus.InStatus text={t('in-challenge-period')} />
    ),
    [MessageStatus.READY_FOR_RELAY]: (
      <TxStatus.InStatus text={t('ready-to-claim')} />
    ),
    [MessageStatus.RELAYED]: <TxStatus.Success />,
  }

  const { isLoadingMessageStatus, messageStatus } =
    useAnyChainGetTransactionMessageStatus({
      l1ChainId,
      // @ts-expect-error string is hash `0x${string}`
      transactionHash: withdrawal.transactionHash,
    })

  if (isLoadingMessageStatus) {
    return <Skeleton className="w-24" />
  }

  return statuses[messageStatus]
}

const Header = ({ text }: { text?: string }) => (
  <span className="block px-2 text-left text-sm font-medium text-neutral-400">
    {text}
  </span>
)

const columnsBuilder = (
  t: ReturnType<typeof useTranslations<'tunnel-page.transaction-history'>>,
  l1ChainId: Chain['id'],
): ColumnDef<TokenBridgeMessage>[] => [
  {
    cell({ row }) {
      const chainId = isDeposit(row.original) ? l1ChainId : hemi.id
      return (
        <TxTime
          blockNumber={BigInt(row.original.blockNumber)}
          chainId={chainId}
        />
      )
    },
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
    cell: ({ row }) => (
      <Amount l1ChainId={l1ChainId} operation={row.original} />
    ),
    header: () => <Header text={t('column-headers.amount')} />,
    id: 'amount',
  },
  {
    cell: ({ row }) => (
      <ChainComponent chainId={isDeposit(row.original) ? l1ChainId : hemi.id} />
    ),
    header: () => <Header text={t('column-headers.from')} />,
    id: 'from',
  },
  {
    cell: ({ row }) => (
      <ChainComponent chainId={isDeposit(row.original) ? hemi.id : l1ChainId} />
    ),
    header: () => <Header text={t('column-headers.to')} />,
    id: 'to',
  },
  {
    accessorKey: 'transactionHash',
    cell({ row }) {
      const { transactionHash } = row.original
      const chainId = isDeposit(row.original) ? l1ChainId : hemi.id
      return (
        <TxLink
          chainId={chainId}
          // @ts-expect-error string is `0x${string}`
          txHash={transactionHash}
        />
      )
    },
    header: () => <Header text={t('column-headers.tx-hash')} />,
    id: 'transactionHash',
  },
  {
    accessorKey: 'status',
    cell: ({ row }) =>
      isDeposit(row.original) ? (
        <DepositStatus />
      ) : (
        <WithdrawStatus l1ChainId={l1ChainId} withdrawal={row.original} />
      ),
    header: () => <Header text={t('column-headers.status')} />,
    id: 'status',
  },
  {
    cell: ({ row }) =>
      isDeposit(row.original) ? (
        // Deposits do not render an action, let's add empty space
        <div className="h-9 w-24" />
      ) : (
        <WithdrawAction l1ChainId={l1ChainId} withdraw={row.original} />
      ),
    header: () => <Header />,
    id: 'action',
  },
]

export const TransactionHistory = function () {
  // See https://github.com/BVM-priv/ui-monorepo/issues/158
  const l1ChainId = bridgeableNetworks[0].id

  const { isLoading: isLoadingWithdrawals, withdrawals } =
    useGetWithdrawalsByAddress()
  const { deposits, isLoading: isLoadingDeposits } =
    useGetDepositsByAddress(l1ChainId)

  const t = useTranslations('tunnel-page.transaction-history')

  const loading = isLoadingWithdrawals || isLoadingDeposits

  // Data for useReactTable must be a stable reference
  // otherwise, we hit infinite rerenders
  const data = useMemo(
    () => (withdrawals ?? []).concat(deposits ?? []),
    [deposits, withdrawals],
  )

  const columns = useMemo(
    () =>
      columnsBuilder(t, l1ChainId).map(c =>
        loading
          ? {
              ...c,
              cell: () => <Skeleton className="w-24" />,
            }
          : c,
      ),
    [loading, t, l1ChainId],
  )

  const { width } = useWindowSize()

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
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

  const { pageIndex } = table.getState().pagination
  const pageCount = table.getPageCount()

  const { rows } = table.getRowModel()

  return (
    <>
      <Card borderColor="gray" radius="large">
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
            <tbody>
              {loading &&
                Array.from(Array(10).keys()).map(index => (
                  <tr key={index}>
                    {columns.map((c, i) => (
                      <td className="py-2" key={c.id || i}>
                        {/* @ts-expect-error it works */}
                        {c.cell()}
                      </td>
                    ))}
                  </tr>
                ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    className="py-2 text-center text-neutral-700"
                    colSpan={columns.length}
                  >
                    {t('no-transactions')}
                  </td>
                </tr>
              )}
              {!loading &&
                rows.length > 0 &&
                rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td className="p-2 text-neutral-700" key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
      {!loading && pageCount > 1 && (
        <div className="mt-2 flex justify-center">
          <Tabs>
            {Array.from(Array(pageCount).keys()).map(index => (
              <Tab
                key={index}
                onClick={() => table.setPageIndex(index)}
                selected={pageIndex === index}
              >
                {index + 1}
              </Tab>
            ))}
          </Tabs>
        </div>
      )}
    </>
  )
}
