'use client'

import { useConnectedToSupportedEvmChain } from 'hooks/useConnectedToSupportedChain'
import { useHemi } from 'hooks/useHemi'
import { useNetworks } from 'hooks/useNetworks'
import { useNetworkType } from 'hooks/useNetworkType'
import { usePollHistory } from 'hooks/usePollHistory'
import debounce from 'lodash/debounce'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { RemoteChain } from 'types/chain'
import {
  DepositTunnelOperation,
  TunnelOperation,
  WithdrawTunnelOperation,
} from 'types/tunnel'
import { findChainById, isEvmNetwork } from 'utils/chain'
import { chainConfiguration } from 'utils/sync-history/chainConfiguration'
import { Address, Chain } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import { useAccount } from 'wagmi'

import { HistoryActions, HistoryReducerState, StorageChain } from './types'
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

export const HistoryLoader = function ({
  dispatch,
  forceResync,
  history,
  setForceResync,
}: {
  dispatch: Dispatch<HistoryActions>
  forceResync: boolean
  history: HistoryReducerState
  setForceResync: Dispatch<SetStateAction<boolean>>
}) {
  const { address } = useAccount()
  const l2ChainId = useHemi().id
  const { remoteNetworks } = useNetworks()
  const [networkType] = useNetworkType()

  // use this boolean to check if the past history was restored from local storage
  const [loadedFromLocalStorage, setLoadedFromLocalStorage] = useState(false)

  const supportedEvmChain = useConnectedToSupportedEvmChain()

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

  usePollHistory({
    chainId: networkType === 'testnet' ? sepolia.id : mainnet.id,
    dispatch,
    history,
  })

  usePollHistory({
    chainId: l2ChainId,
    dispatch,
    history,
  })

  return null
}
