import { remoteNetworks, hemi, type RemoteChain } from 'app/networks'
import {
  type DepositTunnelOperation,
  type TunnelOperation,
  type WithdrawTunnelOperation,
} from 'context/tunnelHistoryContext/types'
import { useConnectedToSupportedEvmChain } from 'hooks/useConnectedToSupportedChain'
import debounce from 'lodash/debounce'
import { useEffect, useReducer, useState } from 'react'
import { chainConfiguration } from 'utils/sync-history/chainConfiguration'
import { type Address, type Chain } from 'viem'
import { useAccount } from 'wagmi'

import {
  type HistoryActions,
  type HistoryReducerState,
  type StorageChain,
} from './types'
import {
  addOperation,
  getTunnelHistoryDepositFallbackStorageKey,
  getTunnelHistoryDepositStorageKey,
  getTunnelHistoryWithdrawStorageKey,
  getTunnelHistoryWithdrawStorageKeyFallback,
  hasFinishedSyncing,
  syncContent,
  updateOperation,
} from './utils'

// the _:never is used to fail compilation if a case is missing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const compilationError = function (_: never): never {
  throw new Error('Missing implementation of action in reducer')
}

const initialState: HistoryReducerState = {
  deposits: [],
  status: 'idle',
  withdrawals: [],
}

const historyReducer = function (
  state: HistoryReducerState,
  action: HistoryActions,
): HistoryReducerState {
  const { type } = action
  switch (type) {
    case 'add-deposit': {
      const { payload: newDeposit } = action
      const deposits = addOperation(state.deposits, newDeposit)

      return {
        ...state,
        deposits,
      }
    }
    case 'add-withdraw': {
      const { payload: newWithdrawal } = action
      const withdrawals = addOperation(state.withdrawals, newWithdrawal)
      return {
        ...state,
        withdrawals,
      }
    }
    case 'reset':
      return { ...initialState }
    case 'restore': {
      const { payload } = action
      return {
        ...state,
        deposits: payload.deposits.map(chainDeposits => ({
          ...chainDeposits,
          // See https://github.com/hemilabs/ui-monorepo/issues/462
          content: chainDeposits.content.map(
            deposit =>
              ({
                ...deposit,
                l1ChainId: deposit.l1ChainId,
                l2ChainId: deposit.l2ChainId ?? hemi.id,
              }) as DepositTunnelOperation,
          ),
        })),
        status: 'ready',
        withdrawals: payload.withdrawals.map(chainWithdrawals => ({
          ...chainWithdrawals,
          // See https://github.com/hemilabs/ui-monorepo/issues/462
          content: chainWithdrawals.content.map(
            withdrawal =>
              ({
                ...withdrawal,
                l1ChainId: withdrawal.l1ChainId,
                l2ChainId: withdrawal.l2ChainId ?? hemi.id,
              }) as WithdrawTunnelOperation,
          ),
        })),
      }
    }
    case 'sync': {
      return {
        ...state,
        status: 'syncing',
      }
    }
    case 'sync-deposits': {
      const { chainId } = action.payload
      const deposits = state.deposits.map(currentDeposits =>
        currentDeposits.chainId === chainId
          ? syncContent(currentDeposits, action.payload)
          : currentDeposits,
      )

      return {
        ...state,
        deposits,
        status: hasFinishedSyncing(state) ? 'finished' : state.status,
      }
    }
    case 'sync-withdrawals': {
      const { chainId } = action.payload
      const withdrawals = state.withdrawals.map(chainWithdrawals =>
        chainWithdrawals.chainId === chainId
          ? syncContent(chainWithdrawals, action.payload)
          : chainWithdrawals,
      )
      return {
        ...state,
        status: hasFinishedSyncing(state) ? 'finished' : state.status,
        withdrawals,
      }
    }
    case 'update-deposit': {
      const { deposit, updates } = action.payload
      const deposits = updateOperation(state.deposits, {
        operation: deposit,
        updates,
      })

      return {
        ...state,
        deposits,
      }
    }
    case 'update-withdraw': {
      const { withdraw, updates } = action.payload
      const withdrawals = updateOperation(state.withdrawals, {
        operation: withdraw,
        updates,
      })

      return {
        ...state,
        withdrawals,
      }
    }
    default:
      // if a switch statement is missing on all possible actions
      // this will fail on compile time
      return compilationError(type)
  }
}

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
    ...(JSON.parse(restored) as Omit<StorageChain<T>, 'chainId'>),
    chainId,
  }
}

const debounceTime = 500
const debouncedSaveToStorage = debounce(
  (l2ChainId: Chain['id'], address: Address, history: HistoryReducerState) =>
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
        .map(({ id }) =>
          readStateFromStorage<DepositTunnelOperation>({
            chainId: id,
            configChainId: id,
            fallbackKey: getTunnelHistoryDepositFallbackStorageKey(id, address),
            key: getTunnelHistoryDepositStorageKey(id, l2ChainId, address),
          }),
        )
        .filter(Boolean)
      // and we can also load withdrawals from Hemi
      const withdrawals = remoteNetworks
        .map(({ id }) =>
          readStateFromStorage<WithdrawTunnelOperation>({
            chainId: id,
            configChainId: l2ChainId,
            fallbackKey: getTunnelHistoryWithdrawStorageKeyFallback(
              l2ChainId,
              address,
            ),
            key: getTunnelHistoryWithdrawStorageKey(id, l2ChainId, address),
          }),
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
      debouncedSaveToStorage(l2ChainId, address, history)
    },
    [address, history, l2ChainId, loadedFromLocalStorage, supportedEvmChain],
  )

  // TODO should I need unmount effect telling that I need to idle sync status?

  return reducer
}
