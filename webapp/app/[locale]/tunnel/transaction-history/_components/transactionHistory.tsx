'use client'

import { Card } from 'components/card'
import { useConnectedToSupportedEvmChain } from 'hooks/useConnectedToSupportedChain'
import { useConnectedToUnsupportedEvmChain } from 'hooks/useConnectedToUnsupportedChain'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useMemo, useRef } from 'react'
import Skeleton from 'react-loading-skeleton'
import { TunnelOperation } from 'types/tunnel'
import { isBtcOperation, isEvmOperation } from 'utils/tunnel'
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

export const TransactionHistory = function ({
  filterOption,
}: {
  filterOption: FilterOptions
}) {
  const { status } = useAccount()
  const { data, loading } = useTransactionsHistory(filterOption)

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
        {connectedToSupportedChain && showTable && (
          <Table data={data} loading={loading} />
        )}
        {connectedToSupportedChain && !showTable && <NoTransactions />}
        {connectedToUnsupportedChain && <UnsupportedChain />}
        {status === 'connecting' && (
          <Skeleton className="h-[calc(100%-theme(spacing.2))] w-full rounded-2xl" />
        )}
        {status === 'disconnected' && <ConnectWallet />}
      </div>
    </Card>
  )
}
