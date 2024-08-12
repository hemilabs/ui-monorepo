import { type RemoteChain } from 'app/networks'
import {
  type HistoryActions,
  type HistoryReducerState,
} from 'hooks/useSyncHistory/types'
import { type Dispatch, useEffect, useRef, useState } from 'react'
import { type Address, type Chain } from 'viem'

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
  const workerRef = useRef<Worker>(null)
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
      dispatch({ type: 'sync' })

      return function () {
        dispatch({ type: 'reset' })

        setWorkerLoaded(false)
        workerRef.current.removeEventListener(
          'message',
          processWebWorkerMessage,
        )
        workerRef.current.terminate()
        workerRef.current = null
      }
    },
    [address, dispatch, l1ChainId, l2ChainId, setWorkerLoaded],
  )

  useEffect(
    function startSyncing() {
      if (!workerRef.current || workerLoaded) {
        return
      }
      setWorkerLoaded(true)

      if (process.env.NEXT_PUBLIC_WORKERS_DEBUG_ENABLE === 'true') {
        // See https://github.com/debug-js/debug/issues/916#issuecomment-1539231712https://github.com/debug-js/debug/issues/916#issuecomment-1539231712
        const debugString = localStorage.getItem('debug')
        workerRef.current.postMessage({
          payload: debugString,
          type: 'enable-debug',
        })
      }

      // Send the parameters the worker needs to start working - excluding deposits and withdrawals!
      const { content: deposits, ...depositSyncInfo } = history.deposits.find(
        chainDeposits => chainDeposits.chainId === l1ChainId,
      )

      const { content: withdrawals, ...withdrawSyncInfo } =
        history.withdrawals.find(
          chainWithdrawals => chainWithdrawals.chainId === l1ChainId,
        )

      workerRef.current.postMessage({
        address,
        depositSyncInfo,
        l1ChainId,
        l2ChainId,
        type: 'start',
        withdrawSyncInfo,
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
