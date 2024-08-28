import { featureFlags } from 'app/featureFlags'
import { useBitcoin } from 'hooks/useBitcoin'
import { useConnectedToSupportedEvmChain } from 'hooks/useConnectedToSupportedChain'
import { useNetworks } from 'hooks/useNetworks'
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
import { useAccount } from 'wagmi'

import { historyReducer, initialState } from './reducer'
import { type HistoryReducerState, type StorageChain } from './types'
import {
  getTunnelHistoryDepositFallbackStorageKey,
  getTunnelHistoryDepositStorageKey,
  getTunnelHistoryWithdrawStorageKey,
  getTunnelHistoryWithdrawStorageKeyFallback,
} from './utils'

const readStateFromStorage = function <T extends TunnelOperation>({
  chainId,
  configChainId,
  fallbackKey,
  key,
}: {
  chainId: RemoteChain['id']
  configChainId: RemoteChain['id']
  fallbackKey?: string
  key: string
}) {
  const restored =
    localStorage.getItem(key) ||
    (fallbackKey ? localStorage.getItem(fallbackKey) : null)
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
  const bitcoin = useBitcoin()
  const { remoteNetworks } = useNetworks()

  const [loadedFromLocalStorage, setLoadedFromLocalStorage] = useState(false)
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
      if (loadedFromLocalStorage || !supportedEvmChain) {
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
              fallbackKey: getTunnelHistoryDepositFallbackStorageKey(
                id,
                address,
              ),
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
              fallbackKey: getTunnelHistoryWithdrawStorageKeyFallback(
                l2ChainId,
                address,
              ),
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
        !supportedEvmChain ||
        !loadedFromLocalStorage ||
        !['finished', 'syncing'].includes(history.status)
      ) {
        return
      }
      debouncedSaveToStorage({ address, history, l2ChainId, remoteNetworks })
    },
    [
      address,
      history,
      l2ChainId,
      loadedFromLocalStorage,
      remoteNetworks,
      supportedEvmChain,
    ],
  )

  const historyContext = useMemo(
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
      withdrawals: history.withdrawals
        .filter(w => featureFlags.btcTunnelEnabled || w.chainId !== bitcoin.id)
        .flatMap(w => w.content),
    }),
    [bitcoin.id, dispatch, history],
  )

  return [...reducer, historyContext] as const
}
