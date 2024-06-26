'use client'

import { useQueryClient } from '@tanstack/react-query'
import { evmRemoteNetworks, hemi } from 'app/networks'
import dynamic from 'next/dynamic'
import { createContext, useMemo, ReactNode } from 'react'
import { type SyncStatus } from 'ui-common/hooks/useSyncInBlockChunks'
import { type Address, type Chain } from 'viem'

import { getDeposits, getWithdrawals } from './operations'
import { DepositOperation, WithdrawOperation } from './types'
import { useSyncTunnelOperations } from './useSyncTunnelOperations'

const WithdrawalsStatusUpdater = dynamic(
  () =>
    import('./withdrawalsStatusUpdater').then(
      mod => mod.WithdrawalsStatusUpdater,
    ),
  { ssr: false },
)

const getTunnelHistoryDepositStorageKey = (
  l1ChainId: Chain['id'],
  address: Address,
) => `portal.transaction-history-L1-${l1ChainId}-${address}-deposits`

const getTunnelHistoryWithdrawStorageKey = (
  l2ChainId: Chain['id'],
  address: Address,
) => `portal.transaction-history-L2-${l2ChainId}-${address}-withdrawals`

type TunnelHistoryContext = {
  addDepositToTunnelHistory: (
    deposit: Omit<DepositOperation, 'timestamp'>,
  ) => void
  addWithdrawalToTunnelHistory: (
    withdrawal: Omit<WithdrawOperation, 'timestamp'>,
  ) => void
  deposits: DepositOperation[]
  depositSyncStatus: SyncStatus
  resumeSync: () => void
  updateWithdrawal: (
    withdrawal: WithdrawOperation,
    updates: Partial<WithdrawOperation>,
  ) => void
  withdrawSyncStatus: SyncStatus
  withdrawals: WithdrawOperation[]
}

export const TunnelHistoryContext = createContext<TunnelHistoryContext>({
  addDepositToTunnelHistory: () => undefined,
  addWithdrawalToTunnelHistory: () => undefined,
  deposits: [],
  depositSyncStatus: 'syncing',
  resumeSync: () => undefined,
  updateWithdrawal: () => undefined,
  withdrawals: [],
  withdrawSyncStatus: 'syncing',
})

type Props = {
  children: ReactNode
}

export const TunnelHistoryProvider = function ({ children }: Props) {
  // TODO https://github.com/BVM-priv/ui-monorepo/issues/158
  const l1ChainId = evmRemoteNetworks[0].id

  const queryClient = useQueryClient()

  const depositState = useSyncTunnelOperations<DepositOperation>({
    chainId: l1ChainId,
    getStorageKey: getTunnelHistoryDepositStorageKey,
    getTunnelOperations: getDeposits,
    l1ChainId,
  })

  const withdrawalsState = useSyncTunnelOperations<WithdrawOperation>({
    chainId: hemi.id,
    getStorageKey: getTunnelHistoryWithdrawStorageKey,
    getTunnelOperations: getWithdrawals,
    l1ChainId,
  })

  const value = useMemo(
    () => ({
      addDepositToTunnelHistory: depositState.addOperationToTunnelHistory,
      addWithdrawalToTunnelHistory:
        withdrawalsState.addOperationToTunnelHistory,
      deposits: depositState.operations,
      depositSyncStatus: depositState.syncStatus,
      resumeSync() {
        depositState.resumeSync()
        withdrawalsState.resumeSync()
      },
      updateWithdrawal(
        withdrawal: WithdrawOperation,
        updates: Partial<WithdrawOperation>,
      ) {
        withdrawalsState.updateOperation(function (current) {
          const newState = {
            ...current,
            content: current.content.map(o =>
              o.transactionHash === withdrawal.transactionHash &&
              o.direction === withdrawal.direction
                ? { ...o, ...updates }
                : o,
            ),
          }
          return newState
        })
        if (
          updates.status !== undefined &&
          withdrawal.status !== updates.status
        ) {
          queryClient.setQueryData(
            [
              withdrawal.direction,
              l1ChainId,
              withdrawal.transactionHash,
              'getMessageStatus',
            ],
            updates.status,
          )
        }
      },
      withdrawals: withdrawalsState.operations,
      withdrawSyncStatus: withdrawalsState.syncStatus,
    }),
    [depositState, l1ChainId, queryClient, withdrawalsState],
  )

  return (
    <TunnelHistoryContext.Provider value={value}>
      <WithdrawalsStatusUpdater />
      {children}
    </TunnelHistoryContext.Provider>
  )
}
