import { Button } from 'components/button'
import { useTranslations } from 'next-intl'
import { type FormEvent, useContext, useEffect } from 'react'
import { ToEvmWithdrawOperation } from 'types/tunnel'

import { ToEvmWithdrawalContext } from '../_context/toEvmWithdrawalContext'
import { useProveTransaction } from '../_hooks/useProveTransaction'

import { DrawerCallToAction } from './reviewOperation/drawerCallToAction'

type Props = {
  withdrawal: ToEvmWithdrawOperation
}

export const ProveWithdrawal = function ({ withdrawal }: Props) {
  const [operationStatus, setOperationStatus] = useContext(
    ToEvmWithdrawalContext,
  )
  const {
    isReadyToProve,
    proveWithdrawal,
    withdrawalProofReceipt,
    proveWithdrawalError,
    withdrawalProofReceiptError,
  } = useProveTransaction(withdrawal)
  const t = useTranslations('tunnel-page.submit-button')

  const isProving = operationStatus === 'proving'

  useEffect(
    function clearAfterSuccessfulProve() {
      if (
        withdrawalProofReceipt?.status !== 'success' ||
        operationStatus !== 'proving'
      ) {
        return
      }
      setOperationStatus('idle')
    },
    [operationStatus, setOperationStatus, withdrawalProofReceipt],
  )

  useEffect(
    function handleUserRejection() {
      if (proveWithdrawalError && isProving) {
        setOperationStatus('rejected')
      }
    },
    [isProving, proveWithdrawalError, setOperationStatus],
  )

  useEffect(
    function handleTransactionFailure() {
      if (withdrawalProofReceiptError && isProving) {
        setOperationStatus('failed')
      }
    },
    [isProving, withdrawalProofReceiptError, setOperationStatus],
  )

  const handleProve = function (e: FormEvent) {
    e.preventDefault()
    setOperationStatus('proving')
    proveWithdrawal()
  }

  const getText = function () {
    if (isProving) {
      return 'proving-withdrawal'
    }
    if (['failed', 'rejected'].includes(operationStatus)) {
      return 'try-again'
    }
    return 'prove-withdrawal'
  }

  return (
    <DrawerCallToAction
      expectedChainId={withdrawal.l1ChainId}
      onSubmit={handleProve}
      submitButton={
        <Button disabled={!isReadyToProve || isProving} type="submit">
          {t(getText())}
        </Button>
      }
    />
  )
}
