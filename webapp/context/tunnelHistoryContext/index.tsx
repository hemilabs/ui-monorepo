'use client'

import { bridgeableNetworks, hemi } from 'app/networks'
import { createContext, useMemo, ReactNode } from 'react'
import { type SyncStatus } from 'ui-common/hooks/useSyncInBlockChunks'
import { type Address, type Chain } from 'viem'

import { getDeposits, getWithdrawals } from './operations'
import { DepositOperation, WithdrawOperation } from './types'
import { useSyncTunnelOperations } from './useSyncTunnelOperations'

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
  ) => Promise<void>
  addWithdrawalToTunnelHistory: (
    withdrawal: Omit<WithdrawOperation, 'timestamp'>,
  ) => Promise<void>
  deposits: DepositOperation[]
  depositSyncStatus: SyncStatus
  resumeSync: () => void
  withdrawSyncStatus: SyncStatus
  withdrawals: WithdrawOperation[]
}

export const TunnelHistoryContext = createContext<TunnelHistoryContext>({
  addDepositToTunnelHistory: () => undefined,
  addWithdrawalToTunnelHistory: () => undefined,
  deposits: [],
  depositSyncStatus: 'syncing',
  resumeSync: () => undefined,
  withdrawals: [],
  withdrawSyncStatus: 'syncing',
})

type Props = {
  children: ReactNode
}

export const TunnelHistoryProvider = function ({ children }: Props) {
  // TODO https://github.com/BVM-priv/ui-monorepo/issues/158
  const l1ChainId = bridgeableNetworks[0].id

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
      withdrawals: withdrawalsState.operations,
      withdrawSyncStatus: withdrawalsState.syncStatus,
    }),
    [depositState, withdrawalsState],
  )

  return (
    <TunnelHistoryContext.Provider value={value}>
      {children}
    </TunnelHistoryContext.Provider>
  )
}
