'use client'

import {
  SyncStatus,
  type HistoryActions,
  type HistoryReducerState,
} from 'context/tunnelHistoryContext/types'
import { useHemi } from 'hooks/useHemi'
import { useNetworks } from 'hooks/useNetworks'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { type Dispatch, useEffect, useRef, useState } from 'react'
import { type RemoteChain } from 'types/chain'
import { type Address, type Chain } from 'viem'
import { useAccount } from 'wagmi'
import { AppToWebWorker } from 'workers/history'

const isReadyOrSyncing = (status: SyncStatus | undefined) =>
  !!status && ['ready', 'syncing'].includes(status)

const isChainReadyOrSyncing =
  (history: HistoryReducerState) => (chain: RemoteChain) =>
    isReadyOrSyncing(
      history.deposits.find(d => d.chainId === chain.id)?.status,
    ) ||
    isReadyOrSyncing(
      history.withdrawals.find(d => d.chainId === chain.id)?.status,
    )

type Props = {
  address: Address
  dispatch: Dispatch<HistoryActions>
  history: HistoryReducerState
  l1ChainId: RemoteChain['id']
  l2ChainId: Chain['id']
}

const SyncHistoryWorker = function ({
  address,
  dispatch,
  history,
  l1ChainId,
  l2ChainId,
}: Props) {
  const workerRef = useRef<AppToWebWorker>(null)
  const [workerLoaded, setWorkerLoaded] = useState(false)

  // This must be done here because there's some weird issue when moving it into a custom hook that prevents
  // the worker from being loaded. It seems that by loading this component dynamically (Which we do), it doesn't get blocked
  // as a different origin when running in localhost. When loading statically from a hook, the error
  // Failed to construct 'Worker': Script at 'cannot be accessed from origin localhost
  // is logged
  useEffect(
    function initWorker() {
      // load the Worker
      workerRef.current = new Worker(
        new URL('../workers/history.ts', import.meta.url),
      )

      // listen for state updates and forward to our history reducer
      const processWebWorkerMessage = (event: MessageEvent<HistoryActions>) =>
        dispatch(event.data)

      workerRef.current.addEventListener('message', processWebWorkerMessage)

      // announce we're syncing
      dispatch({ payload: { chainId: l1ChainId }, type: 'sync' })

      return function () {
        if (!workerRef.current) {
          return
        }
        setWorkerLoaded(false)
        workerRef.current.removeEventListener(
          'message',
          processWebWorkerMessage,
        )
        workerRef.current.terminate()
        workerRef.current = null
      }
    },
    [address, dispatch, l1ChainId, l2ChainId, setWorkerLoaded, workerRef],
  )

  useEffect(
    function startSyncing() {
      if (!workerRef.current || workerLoaded) {
        return
      }
      setWorkerLoaded(true)

      if (process.env.NEXT_PUBLIC_WORKERS_DEBUG_ENABLE === 'true') {
        // See https://github.com/debug-js/debug/issues/916#issuecomment-1539231712
        const debugString = localStorage.getItem('debug') ?? '*'
        workerRef.current.postMessage({
          payload: debugString,
          type: 'enable-debug',
        })
      }

      // Send the parameters the worker needs to start working - excluding deposits and withdrawals!
      const { content: deposits, ...depositsSyncInfo } = history.deposits.find(
        chainDeposits => chainDeposits.chainId === l1ChainId,
      )

      const { content: withdrawals, ...withdrawalsSyncInfo } =
        history.withdrawals.find(
          chainWithdrawals => chainWithdrawals.chainId === l1ChainId,
        )

      workerRef.current.postMessage({
        address,
        depositsSyncInfo,
        l1ChainId,
        l2ChainId,
        type: 'start',
        withdrawalsSyncInfo,
      })
    },
    [
      address,
      history,
      l1ChainId,
      l2ChainId,
      setWorkerLoaded,
      workerLoaded,
      workerRef,
    ],
  )
  return null
}

export const SyncHistoryWorkers = function () {
  const { address, isConnected } = useAccount()
  const l2ChainId = useHemi().id
  const { remoteNetworks } = useNetworks()
  const { dispatch, history, syncStatus } = useTunnelHistory()

  const historyChainSync = []

  // We need to be ready or syncing to return workers
  if (isConnected && address && ['ready', 'syncing'].includes(syncStatus)) {
    // Add workers for every pair L1-Hemi chain
    historyChainSync.push(
      ...remoteNetworks
        .filter(isChainReadyOrSyncing(history))
        .map(l1Chain => (
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

  return <>{historyChainSync}</>
}
