import { useEffect, useState } from 'react'

export const useShowTransactionFromPreviousStep = function (
  txHash: string | undefined,
) {
  const [showOperationFromPreviousStep, setShowOperationFromPreviousStep] =
    useState(!!txHash)

  useEffect(
    function stopShowingOperationFromPreviousStep() {
      const timeoutId = setTimeout(function () {
        if (showOperationFromPreviousStep) {
          setShowOperationFromPreviousStep(false)
        }
      }, 7000)
      return () => clearTimeout(timeoutId)
    },
    [setShowOperationFromPreviousStep, showOperationFromPreviousStep],
  )

  return showOperationFromPreviousStep
}
