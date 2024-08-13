import { useEffect, useState } from 'react'

type Parameters = {
  clearState: () => void
  errorReceipts: unknown[]
  onError: () => void
  onSuccess: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transactionReceipt: Record<string, any> | undefined
}

export const useAfterTransaction = function ({
  clearState,
  errorReceipts,
  onError,
  onSuccess,
  transactionReceipt,
}: Parameters) {
  // use this to avoid infinite loops in effects when resetting the form
  const [hasClearedForm, setHasClearedForm] = useState(false)
  /**
   * This effect is used to reset the form after a transaction
   * is either rejected or failed.
   */
  useEffect(
    function handleErrors() {
      // check if any error receipt is defined
      if (!errorReceipts.some(Boolean)) {
        return undefined
      }
      const timeoutId = setTimeout(clearState, 7000)
      if (!hasClearedForm) {
        setHasClearedForm(true)
        onError()
      }
      return () => clearTimeout(timeoutId)
    },
    [onError, clearState, errorReceipts, hasClearedForm, setHasClearedForm],
  )

  /**
   * This effect is used to reset the form and run a callback function after a TX
   * is successfully completed.
   */
  useEffect(
    function handleSuccess() {
      if (
        // EVM receipts
        transactionReceipt?.status !== 'success' &&
        // Bitcoin receipts
        !transactionReceipt?.status.confirmed
      ) {
        return undefined
      }
      const timeoutId = setTimeout(clearState, 7000)
      if (!hasClearedForm) {
        setHasClearedForm(true)
        onSuccess()
      }
      return () => clearTimeout(timeoutId)
    },
    [
      clearState,
      hasClearedForm,
      onSuccess,
      setHasClearedForm,
      transactionReceipt,
    ],
  )

  return {
    beforeTransaction: () => setHasClearedForm(false),
  }
}
