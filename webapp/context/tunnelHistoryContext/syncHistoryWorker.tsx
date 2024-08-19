import { type RemoteChain } from 'app/networks'
import {
  type HistoryActions,
  type HistoryReducerState,
} from 'hooks/useSyncHistory/types'
import { type Dispatch, useEffect, useRef, useState } from 'react'
import { type Address, type Chain } from 'viem'
import { AppToWebWorker } from 'workers/history'

type Props = {
  address: Address
  dispatch: Dispatch<HistoryActions>
  history: HistoryReducerState
  l1ChainId: RemoteChain['id']
  l2ChainId: Chain['id']
}

export const SyncHistoryWorker = function ({
  address,
  dispatch,
  history,
  l1ChainId,
  l2ChainId,
}: Props) {
  const workerRef = useRef<AppToWebWorker>(null)
  const [workerLoaded, setWorkerLoaded] = useState(false)

  useEffect(
    function initWorker() {
      // load the Worker
      workerRef.current = new Worker(
        new URL(`../../workers/history.ts`, import.meta.url),
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
