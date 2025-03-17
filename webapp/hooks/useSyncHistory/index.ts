import { featureFlags } from 'app/featureFlags'
import { useConnectedToSupportedEvmChain } from 'hooks/useConnectedToSupportedChain'
import { useNetworks } from 'hooks/useNetworks'
import { useNetworkType } from 'hooks/useNetworkType'
import debounce from 'lodash/debounce'
import { useEffect, useMemo, useReducer, useState } from 'react'
import { type RemoteChain } from 'types/chain'
import {
  type DepositTunnelOperation,
  type TunnelOperation,
  type WithdrawTunnelOperation,
} from 'types/tunnel'
import { findChainById, isEvmNetwork } from 'utils/chain'
import { chainConfiguration } from 'utils/sync-history/chainConfiguration'
import { type Address, type Chain } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import { useAccount } from 'wagmi'

import { historyReducer, initialState } from './reducer'
import { type HistoryReducerState, type StorageChain } from './types'
import {
  getTunnelHistoryDepositStorageKey,
  getTunnelHistoryWithdrawStorageKey,
} from './utils'

const readStateFromStorage = function <T extends TunnelOperation>({
  chainId,
  configChainId,
  key,
}: {
  chainId: RemoteChain['id']
  configChainId: RemoteChain['id']
  key: string
}) {
  const restored = localStorage.getItem(key)
  if (!restored) {
    const chain = findChainById(chainId)
    if (isEvmNetwork(chain)) {
      return {
        chainId,
        chunkIndex: 0,
        content: [],
        fromBlock: chainConfiguration[configChainId].minBlockToSync ?? 0,
        hasSyncToMinBlock: false,
        toBlock: undefined,
      }
    }
    return {
      chainId,
      content: [],
      fromKnownTx: undefined,
      hasSyncToMinTx: false,
      toKnownTx: undefined,
      txPivot: undefined,
    }
  }
  return {
    ...(JSON.parse(restored) as Omit<StorageChain<T>, 'chainId'>),
    chainId,
  }
}

const clearHistoryInLocalStorage = ({
  address,
  l2ChainId,
  remoteNetworks,
}: {
  address: Address
  l2ChainId: Chain['id']
  remoteNetworks: RemoteChain[]
}) =>
  remoteNetworks.forEach(function (remoteNetwork) {
    localStorage.removeItem(
      getTunnelHistoryWithdrawStorageKey(remoteNetwork.id, l2ChainId, address),
    )
    localStorage.removeItem(
      getTunnelHistoryDepositStorageKey(remoteNetwork.id, l2ChainId, address),
    )
  })

const debounceTime = 500
const debouncedSaveToStorage = debounce(
  ({
    address,
    history,
    l2ChainId,
    remoteNetworks,
  }: {
    address: Address
    history: HistoryReducerState
    l2ChainId: Chain['id']
    remoteNetworks: RemoteChain[]
  }) =>
    remoteNetworks
      .map(remoteNetwork => [
        history.deposits.find(
          chainDeposits => chainDeposits.chainId === remoteNetwork.id,
        ),
        history.withdrawals.find(
          chainWithdrawals => chainWithdrawals.chainId === remoteNetwork.id,
        ),
      ])
      .forEach(function ([deposits, withdrawals]) {
        if (deposits) {
          // Save deposits
          localStorage.setItem(
            getTunnelHistoryDepositStorageKey(
              deposits.chainId,
              l2ChainId,
              address,
            ),
            JSON.stringify(deposits),
          )
        }
        if (withdrawals) {
          // Save withdrawals
          localStorage.setItem(
            getTunnelHistoryWithdrawStorageKey(
              withdrawals.chainId,
              l2ChainId,
              address,
            ),
            JSON.stringify(withdrawals),
          )
        }
      }),
  debounceTime,
  { leading: true },
)

export const useSyncHistory = function (l2ChainId: Chain['id']) {
  const { address } = useAccount()
  const { remoteNetworks } = useNetworks()
  const [networkType] = useNetworkType()

  // use this boolean to check if the past history was restored from local storage
  const [loadedFromLocalStorage, setLoadedFromLocalStorage] = useState(false)
  // use this boolean to force a resync of the history
  const [forceResync, setForceResync] = useState(false)

  const reducer = useReducer(historyReducer, initialState)

  const supportedEvmChain = useConnectedToSupportedEvmChain()

  const [history, dispatch] = reducer

  useEffect(
    function resetState() {
      if (!supportedEvmChain || !loadedFromLocalStorage) {
        setLoadedFromLocalStorage(false)
        dispatch({ type: 'reset' })
      }
    },
    [
      loadedFromLocalStorage,
      dispatch,
      setLoadedFromLocalStorage,
      supportedEvmChain,
    ],
  )

  useEffect(
    function restoreFromLocalStorage() {
      if (!address || loadedFromLocalStorage || !supportedEvmChain) {
        return
      }
      setLoadedFromLocalStorage(true)
      // Load all the deposits given the Hemi address
      const deposits = remoteNetworks
        .map(
          ({ id }) =>
            readStateFromStorage<DepositTunnelOperation>({
              chainId: id,
              configChainId: id,
              key: getTunnelHistoryDepositStorageKey(id, l2ChainId, address),
            }) as StorageChain<DepositTunnelOperation>,
        )
        .filter(Boolean)
      // and we can also load withdrawals from Hemi
      const withdrawals = remoteNetworks
        .map(
          ({ id }) =>
            readStateFromStorage<WithdrawTunnelOperation>({
              chainId: id,
              configChainId: l2ChainId,
              key: getTunnelHistoryWithdrawStorageKey(id, l2ChainId, address),
            }) as StorageChain<WithdrawTunnelOperation>,
        )
        .filter(Boolean)

      // Dispatch initial load, flag to enable workers to start syncing
      dispatch({
        payload: { deposits, withdrawals },
        type: 'restore',
      })
    },
    [
      address,
      dispatch,
      l2ChainId,
      loadedFromLocalStorage,
      remoteNetworks,
      setLoadedFromLocalStorage,
      supportedEvmChain,
    ],
  )

  useEffect(
    function offloadToStorage() {
      if (
        !address ||
        !supportedEvmChain ||
        !loadedFromLocalStorage ||
        !['finished', 'syncing'].includes(history.status) ||
        // if we started resync, do not save!
        forceResync
      ) {
        return
      }
      debouncedSaveToStorage({ address, history, l2ChainId, remoteNetworks })
    },
    [
      address,
      forceResync,
      history,
      l2ChainId,
      loadedFromLocalStorage,
      remoteNetworks,
      supportedEvmChain,
    ],
  )

  // re-sync needs to take place in an effect, because we need the workers to be tear down
  // (so they start again from the last block), and then, clear the local storage
  // (as local storage is saved in a debounce process, we need to ensure no other effect
  // saves its sync data, overriding what we have just cleared). Once all that is completed
  // we just reset the state of this hook so it starts all over.
  useEffect(
    function clearAndResyncHistory() {
      if (!forceResync) {
        return
      }
      // clear local storage
      clearHistoryInLocalStorage({ address, l2ChainId, remoteNetworks })
      // reset the history in memory
      dispatch({ type: 'reset' })
      // update flag so data is reloaded again
      setLoadedFromLocalStorage(false)
      // mark resync as finished
      setForceResync(false)
    },
    [
      address,
      dispatch,
      forceResync,
      l2ChainId,
      remoteNetworks,
      setForceResync,
      setLoadedFromLocalStorage,
    ],
  )

  // TODO this effect is restricted to sepolia and mainnet only until the feature flag
  // for subgraphs are removed. Once all chains use subgraphs, it can be simplified. Note that
  // if the withdrawals are still syncing this won't have any effect :( but once a pair L1:L2 uses a subgraph
  // for both deposits and withdrawals, this will work correctly
  // See https://github.com/hemilabs/ui-monorepo/issues/743
  const chainIdToUpdate = networkType === 'testnet' ? sepolia.id : mainnet.id
  const depositStatus = history.deposits.find(
    ({ chainId }) => chainId === chainIdToUpdate,
  )?.status
  useEffect(
    function pollEvmDepositsInIntervals() {
      if (!featureFlags.syncHistoryWithSubgraph) {
        return undefined
      }
      // worker is still running, do nothing.
      if (!['ready', 'syncing'].includes(depositStatus)) {
        return undefined
      }
      // force spin up of worker to bring new operations
      const intervalId = setInterval(
        () => dispatch({ payload: { chainId: chainIdToUpdate }, type: 'sync' }),
        // every 2 minutes
        1000 * 60 * 2,
      )

      return () => clearInterval(intervalId)
    },
    [chainIdToUpdate, depositStatus, dispatch],
  )

  const historyContext = useMemo(
    () => ({
      addDepositToTunnelHistory: (deposit: DepositTunnelOperation) =>
        dispatch({ payload: deposit, type: 'add-deposit' }),
      addWithdrawalToTunnelHistory: (withdrawal: WithdrawTunnelOperation) =>
        dispatch({ payload: withdrawal, type: 'add-withdraw' }),
      deposits: history.deposits.flatMap(d => d.content),
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

  return [...reducer, historyContext] as const
}
