'use client'

import { ReactNode, useEffect, useRef } from 'react'

type Props<T> = {
  children: (workerRef: T) => ReactNode
  getWorker: () => T
}

export const WithWorker = function <T extends Worker>({
  children,
  getWorker,
}: Props<T>) {
  const workerRef = useRef<T | null>(null)

  useEffect(
    function initWorker() {
      // load the Worker
      workerRef.current = getWorker()

      if (process.env.NEXT_PUBLIC_WORKERS_DEBUG_ENABLE === 'true') {
        // See https://github.com/debug-js/debug/issues/916#issuecomment-1539231712
        const debugString = localStorage.getItem('debug') ?? '*'
        workerRef.current.postMessage({
          payload: debugString,
          type: 'enable-debug',
        })
      }

      return function terminateWorker() {
        if (!workerRef.current) {
          return
        }
        workerRef.current.terminate()
        workerRef.current = null
      }
    },
    [getWorker, workerRef],
  )

  if (!workerRef.current) {
    return null
  }

  return <>{children(workerRef.current)}</>
}
