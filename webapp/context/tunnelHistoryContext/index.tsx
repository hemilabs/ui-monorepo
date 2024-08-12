'use client'

import { featureFlags } from 'app/featureFlags'
import { bitcoin, hemi, remoteNetworks } from 'app/networks'
import { useSyncHistory } from 'hooks/useSyncHistory'
import { type HistoryReducerState } from 'hooks/useSyncHistory/types'
import dynamic from 'next/dynamic'
import { createContext, useMemo, ReactNode } from 'react'
import { useAccount } from 'wagmi'

import {
  DepositTunnelOperation,
  EvmWithdrawOperation,
  WithdrawTunnelOperation,
} from './types'

const BitcoinDepositsStatusUpdater = dynamic(
  () =>
    import('./bitcoinDepositsStatusUpdater').then(
      mod => mod.BitcoinDepositsStatusUpdater,
    ),
  { ssr: false },
)

const SyncHistoryWorker = dynamic(
  () => import('./syncHistoryWorker').then(mod => mod.SyncHistoryWorker),
  { ssr: false },
)

const WithdrawalsStateUpdater = dynamic(
  () =>
    import('./withdrawalsStateUpdater').then(
      mod => mod.WithdrawalsStateUpdater,
    ),
  { ssr: false },
)

type TunnelHistoryContext = {
  addDepositToTunnelHistory: (deposit: DepositTunnelOperation) => void
  addWithdrawalToTunnelHistory: (
    withdrawal: Omit<EvmWithdrawOperation, 'timestamp'>,
  ) => void
  deposits: DepositTunnelOperation[]
  syncStatus: HistoryReducerState['status']
  updateDeposit: (
    deposit: DepositTunnelOperation,
    updates: Partial<DepositTunnelOperation>,
  ) => void
  updateWithdrawal: (
    withdrawal: EvmWithdrawOperation,
    updates: Partial<EvmWithdrawOperation>,
  ) => void
  withdrawals: EvmWithdrawOperation[]
}

export const TunnelHistoryContext = createContext<TunnelHistoryContext>({
  addDepositToTunnelHistory: () => undefined,
  addWithdrawalToTunnelHistory: () => undefined,
  deposits: [],
  syncStatus: 'idle',
  updateDeposit: () => undefined,
  updateWithdrawal: () => undefined,
  withdrawals: [],
})

type Props = {
  children: ReactNode
}

export const TunnelHistoryProvider = function ({ children }: Props) {
  const { address, isConnected } = useAccount()

  // See https://github.com/hemilabs/ui-monorepo/issues/462
  const l2ChainId = hemi.id

  const [history, dispatch] = useSyncHistory(l2ChainId)

  const historyChainSync = []

  // We need to be ready or syncing to return workers
  if (isConnected && ['ready', 'syncing'].includes(history.status)) {
    // Add workers for every pair L1-Hemi chain
    historyChainSync.push(
      ...remoteNetworks.map(l1Chain => (
        <SyncHistoryWorker
          address={address}
          dispatch={dispatch}
          history={history}
          key={`${l1Chain.id}_${l2ChainId}_${address}`}
          l1ChainId={l1Chain.id}
          l2ChainId={l2ChainId}
        />
      )),
    )
  }

  const value = useMemo(
    () => ({
      addDepositToTunnelHistory: (deposit: DepositTunnelOperation) =>
        dispatch({ payload: deposit, type: 'add-deposit' }),
      addWithdrawalToTunnelHistory: (withdrawal: WithdrawTunnelOperation) =>
        dispatch({ payload: withdrawal, type: 'add-withdraw' }),
      deposits: history.deposits
        .filter(d => featureFlags.btcTunnelEnabled || d.chainId !== bitcoin.id)
        .flatMap(d => d.content),
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
      withdrawals: history.withdrawals.flatMap(d => d.content),
    }),
    [dispatch, history],
  )

  return (
    <TunnelHistoryContext.Provider value={value}>
      {/* This could be done in a background process https://github.com/hemilabs/ui-monorepo/issues/390 */}
      {/* Track updates on bitcoin deposits, in bitcoin or in Hemi */}
      {featureFlags.btcTunnelEnabled && <BitcoinDepositsStatusUpdater />}
      {/* Track updates on withdrawals from Hemi */}
      <WithdrawalsStateUpdater />
      {children}
      {/* Sync the transaction history per chain in the background */}
      {historyChainSync}
    </TunnelHistoryContext.Provider>
  )
}
