'use client'

import dynamic from 'next/dynamic'
import {
  createContext,
  Dispatch,
  ReactNode,
  useMemo,
  useReducer,
  useState,
} from 'react'
import {
  type DepositTunnelOperation,
  type WithdrawTunnelOperation,
} from 'types/tunnel'

import { historyReducer, initialState } from './reducer'
import { HistoryActions, type HistoryReducerState } from './types'

const HistoryLoader = dynamic(
  () => import('./historyLoader').then(mod => mod.HistoryLoader),
  { ssr: false },
)

type TunnelHistoryContext = {
  addDepositToTunnelHistory: (deposit: DepositTunnelOperation) => void
  addWithdrawalToTunnelHistory: (
    withdrawal: WithdrawTunnelOperation &
      Partial<Pick<WithdrawTunnelOperation, 'timestamp'>>,
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
  // use this boolean to force a resync of the history
  const [forceResync, setForceResync] = useState(false)

  const [history, dispatch] = useReducer(historyReducer, initialState)

  const historyContext = useMemo(
    () => ({
      addDepositToTunnelHistory: (deposit: DepositTunnelOperation) =>
        dispatch({ payload: deposit, type: 'add-deposit' }),
      addWithdrawalToTunnelHistory: (withdrawal: WithdrawTunnelOperation) =>
        dispatch({ payload: withdrawal, type: 'add-withdraw' }),
      deposits: history.deposits.flatMap(d => d.content),
      dispatch,
      history,
      resyncHistory: () => setForceResync(true),
      syncStatus: history.status,
      updateDeposit: (
        deposit: DepositTunnelOperation,
        updates: Partial<DepositTunnelOperation>,
      ) =>
        dispatch({
          payload: { deposit, updates },
          type: 'update-deposit',
        }),
      updateWithdrawal: (
        withdraw: WithdrawTunnelOperation,
        updates: Partial<WithdrawTunnelOperation>,
      ) =>
        dispatch({
          payload: { updates, withdraw },
          type: 'update-withdraw',
        }),
      withdrawals: history.withdrawals.flatMap(w => w.content),
    }),
    [dispatch, history],
  )

  return (
    <TunnelHistoryContext.Provider value={historyContext}>
      <HistoryLoader
        dispatch={dispatch}
        forceResync={forceResync}
        history={history}
        setForceResync={setForceResync}
      />
      {children}
    </TunnelHistoryContext.Provider>
  )
}
