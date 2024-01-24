// A cloned value of the "status" mutations from wagmi
// but with a delay after success/error before becoming idle
// so the status messages can be easily shown
import { useEffect, useState } from 'react'

type Status = 'error' | 'loading' | 'idle' | 'success'

export const useDelayedIdleStatus = function (originalStatus: Status) {
  const state = useState<Status>('idle')

  const [delayedStatus, setDelayedStatus] = state

  useEffect(
    function delayIdleStatus() {
      if (originalStatus !== 'idle') {
        setDelayedStatus(originalStatus)
      }
    },
    [originalStatus, setDelayedStatus],
  )

  useEffect(
    function setDelayedIdleStatus() {
      if (['error', 'success'].includes(delayedStatus)) {
        // clear success message in 5 secs for success, 10 secs for error
        const timeoutId = setTimeout(
          () => setDelayedStatus('idle'),
          delayedStatus === 'success' ? 5000 : 10000,
        )

        return () => clearTimeout(timeoutId)
      }
      return undefined
    },
    [delayedStatus, setDelayedStatus],
  )

  return state
}
