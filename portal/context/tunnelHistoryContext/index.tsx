'use client'

import { useSyncHistory } from 'hooks/useSyncHistory'
import {
  HistoryActions,
  type HistoryReducerState,
} from 'hooks/useSyncHistory/types'
import { createContext, Dispatch, ReactNode } from 'react'
import {
  type DepositTunnelOperation,
  type WithdrawTunnelOperation,
} from 'types/tunnel'

type TunnelHistoryContext = {
  addDepositToTunnelHistory: (deposit: DepositTunnelOperation) => void
  addWithdrawalToTunnelHistory: (
    withdrawal: Omit<WithdrawTunnelOperation, 'timestamp'>,
  ) => void
  deposits: DepositTunnelOperation[]
  dispatch: Dispatch<HistoryActions>
  history: HistoryReducerState
  resyncHistory: () => void
  syncStatus: HistoryReducerState['status']
  updateDeposit: (
    deposit: DepositTunnelOperation,
    updates: Partial<DepositTunnelOperation>,
  ) => void
  updateWithdrawal: (
    withdrawal: WithdrawTunnelOperation,
    updates: Partial<WithdrawTunnelOperation>,
  ) => void
  withdrawals: WithdrawTunnelOperation[]
}

export const TunnelHistoryContext = createContext<TunnelHistoryContext>({
  addDepositToTunnelHistory: () => undefined,
  addWithdrawalToTunnelHistory: () => undefined,
  deposits: [],
  dispatch: () => undefined,
  history: { deposits: [], status: 'idle', withdrawals: [] },
  resyncHistory: () => undefined,
  syncStatus: 'idle',
  updateDeposit: () => undefined,
  updateWithdrawal: () => undefined,
  withdrawals: [],
})

type Props = {
  children: ReactNode
}

export const TunnelHistoryProvider = function ({ children }: Props) {
  const context = useSyncHistory()

  return (
    <TunnelHistoryContext.Provider value={context}>
      {children}
    </TunnelHistoryContext.Provider>
  )
}
