import { useNativeTokenBalance } from 'hooks/useBalance'
import { FormEvent, useEffect, useState } from 'react'
import { Token } from 'types/token'
import { isNativeToken } from 'utils/token'
import { useSendTransaction, useWaitForTransaction } from 'wagmi'

import { useDepositNativeToken } from './useBridgeToken'

type UseDeposit = {
  canDeposit: boolean
  fromInput: string
  fromToken: Token
  toToken: Token
}
export const useDeposit = function ({
  canDeposit,
  fromInput,
  fromToken,
  toToken,
}: UseDeposit) {
  const depositingNative = isNativeToken(fromToken)

  const { depositNativeToken, depositNativeTokenTxHash } =
    useDepositNativeToken({
      amount: fromInput,
      enabled: depositingNative && canDeposit,
    })

  const { status } = useWaitForTransaction({
    hash: depositNativeTokenTxHash,
  })

  // we clone the "status" but we manually update it
  // so the error/success message can be displayed for a few extra seconds
  const [depositStatus, setDepositStatus] =
    useState<ReturnType<typeof useSendTransaction>['status']>('idle')

  const deposit = function (e: FormEvent) {
    e.preventDefault()
    if (depositingNative) {
      setDepositStatus('loading')
      depositNativeToken()
    }
    // TODO Enable deposit token
    // else {
    //   depositToken()
    // }
  }

  useEffect(
    function delayStatus() {
      if (status === 'success') {
        setDepositStatus('success')
      } else if (status === 'error') {
        setDepositStatus('error')
      }
    },
    [status, setDepositStatus],
  )

  useEffect(
    function clearTransactionStatusMessage() {
      if (['error', 'success'].includes(depositStatus)) {
        // clear success message in 5 secs for success, 10 secs for error
        const timeoutId = setTimeout(
          () => setDepositStatus('idle'),
          depositStatus === 'success' ? 5000 : 10000,
        )

        return () => clearTimeout(timeoutId)
      }
      return undefined
    },
    [depositStatus, setDepositStatus],
  )

  const { refetchBalance: refetchFromToken } = useNativeTokenBalance(fromToken)
  const { refetchBalance: refetchToToken } = useNativeTokenBalance(toToken)

  useEffect(
    function refetchBalances() {
      if (['error', 'success'].includes(depositStatus)) {
        refetchFromToken()
        refetchToToken()
      }
    },
    [depositStatus, refetchFromToken, refetchToToken],
  )

  return {
    deposit,
    depositStatus,
    depositTxHash: depositNativeTokenTxHash,
  }
}
