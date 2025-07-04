'use client'

import { Card } from 'components/card'
import { useConnectedToSupportedEvmChain } from 'hooks/useConnectedToSupportedChain'
import { useConnectedToUnsupportedEvmChain } from 'hooks/useConnectedToUnsupportedChain'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useMemo, useRef } from 'react'
import Skeleton from 'react-loading-skeleton'
import { TunnelOperation } from 'types/tunnel'
import {
  isBtcOperation,
  isDeposit,
  isEvmOperation,
  isPendingOperation,
  isWithdraw,
} from 'utils/tunnel'
import { useAccount } from 'wagmi'

import { ConnectWallet } from './connectWallet'
import { NoTransactions } from './noTransactions'
import { Table } from './table'
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
  const { data, isSettled, loading } = useTransactionsHistory(filterOption)

  const containerRef = useRef<HTMLDivElement>(null)

  // One is not the opposite of the other, as these consider if the user is connected to the wallet!
  const connectedToSupportedChain = useConnectedToSupportedEvmChain()
  const connectedToUnsupportedChain = useConnectedToUnsupportedEvmChain()

  const showTable = loading || data.length > 0

  return (
    <Card>
      <div
        className="transaction-history-container overflow-x-auto p-2"
        ref={containerRef}
      >
        {connectedToSupportedChain && (
          <>
            {showTable && (
              <Table
                containerRef={containerRef}
                data={data}
                filterOption={filterOption}
                loading={loading}
                setFilterOption={setFilterOption}
              />
            )}
            {/* Only show NoTransactions after syncing finishes and data remains empty.
            Prevents flicker during initial load. */}
            {isSettled && data.length === 0 && <NoTransactions />}
          </>
        )}
        {connectedToUnsupportedChain && <UnsupportedChain />}
        {status === 'connecting' && (
          <Skeleton className="h-[calc(100%-theme(spacing.2))] w-full rounded-2xl" />
        )}
        {status === 'disconnected' && <ConnectWallet />}
      </div>
    </Card>
  )
}
