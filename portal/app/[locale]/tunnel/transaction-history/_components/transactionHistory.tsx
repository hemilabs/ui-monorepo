import { Table } from 'components/table'
import { TableCard } from 'components/table/tableCard'
import { useConnectedToSupportedEvmChain } from 'hooks/useConnectedToSupportedChain'
import { useConnectedToUnsupportedEvmChain } from 'hooks/useConnectedToUnsupportedChain'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useCallback, useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import { TunnelOperation } from 'types/tunnel'
import { useTranslations } from 'use-intl'
import {
  isBtcOperation,
  isDeposit,
  isEvmOperation,
  isPendingOperation,
  isWithdraw,
} from 'utils/tunnel'
import { useAccount } from 'wagmi'

import { useTunnelOperation } from '../../_hooks/useTunnelOperation'

import { buildColumns } from './columns'
import { ConnectWallet } from './connectWallet'
import { NoTransactions } from './noTransactions'
import { type FilterOptions } from './topBar'
import { UnsupportedChain } from './unsupportedChain'

const useTransactionsHistory = function (filter: FilterOptions) {
  const { deposits, syncStatus, withdrawals } = useTunnelHistory()

  const data = useMemo(
    () =>
      ([] as TunnelOperation[])
        .concat(deposits)
        .concat(withdrawals)
        .filter(
          operation =>
            filter.operation === 'all' ||
            (filter.operation === 'bitcoin' && isBtcOperation(operation)) ||
            (filter.operation === 'ethereum' && isEvmOperation(operation)),
        )
        .filter(
          operation =>
            filter.type === 'all' ||
            (filter.type === 'withdrawals' && isWithdraw(operation)) ||
            (filter.type === 'deposits' && isDeposit(operation)),
        )
        .filter(
          operation =>
            filter.action === 'all' ||
            (filter.action === 'pending' && isPendingOperation(operation)),
        )
        .sort(function (a, b) {
          if (!a.timestamp) {
            return -1
          }
          if (!b.timestamp) {
            return 1
          }

          if (!filter.timeDesc) {
            return a.timestamp - b.timestamp
          }

          return b.timestamp - a.timestamp
        }),
    [deposits, filter, withdrawals],
  )

  return {
    data,
    isSettled: syncStatus === 'finished' || syncStatus === 'error',
    loading: syncStatus === 'syncing',
  }
}

export const TransactionHistory = function ({
  filterOption,
  setFilterOption,
}: {
  filterOption: FilterOptions
  setFilterOption: (filter: FilterOptions) => void
}) {
  const { status } = useAccount()
  const t = useTranslations('tunnel-page.transaction-history')
  const { data, isSettled, loading } = useTransactionsHistory(filterOption)
  const { updateTxHash } = useTunnelOperation()

  // One is not the opposite of the other, as these consider if the user is connected to the wallet!
  const connectedToSupportedChain = useConnectedToSupportedEvmChain()
  const connectedToUnsupportedChain = useConnectedToUnsupportedEvmChain()

  const columns = useMemo(
    () => buildColumns({ filterOption, setFilterOption, t }),
    [filterOption, setFilterOption, t],
  )

  const handleRowClick = useCallback(
    (operation: TunnelOperation) => updateTxHash(operation.transactionHash),
    [updateTxHash],
  )

  const getContent = function () {
    if (status === 'disconnected') {
      return (
        <TableCard>
          <ConnectWallet />
        </TableCard>
      )
    }

    if (status === 'connecting') {
      return (
        <TableCard>
          <Skeleton
            className="block size-full rounded-lg"
            containerClassName="block h-full"
          />
        </TableCard>
      )
    }

    if (connectedToUnsupportedChain) {
      return (
        <TableCard>
          <UnsupportedChain />
        </TableCard>
      )
    }

    if (!connectedToSupportedChain) {
      return null
    }

    // Only show NoTransactions after syncing finishes and data remains empty.
    // Prevents flicker during initial load.
    if (isSettled && data.length === 0) {
      return (
        <TableCard>
          <NoTransactions />
        </TableCard>
      )
    }

    return (
      <Table
        columns={columns}
        containerClassName="flex h-full flex-col"
        data={data}
        fitContainer
        loading={loading}
        onRowClick={handleRowClick}
        priorityColumnIdsOnSmall={['action', 'status', 'type', 'amount']}
      />
    )
  }

  return (
    <div className="w-full text-sm font-medium">
      <div className="h-[56dvh] md:min-h-136">{getContent()}</div>
    </div>
  )
}
