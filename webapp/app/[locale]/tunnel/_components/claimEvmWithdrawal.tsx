import { Button } from 'components/button'
import { useTranslations } from 'next-intl'
import { type FormEvent, useContext, useEffect } from 'react'
import { ToEvmWithdrawOperation } from 'types/tunnel'

import { ToEvmWithdrawalContext } from '../_context/toEvmWithdrawalContext'
import { useClaimTransaction } from '../_hooks/useClaimTransaction'

import { DrawerCallToAction } from './reviewOperation/drawerCallToAction'

type Props = {
  withdrawal: ToEvmWithdrawOperation
}

export const ClaimEvmWithdrawal = function ({ withdrawal }: Props) {
  const {
    claimWithdrawal,
    claimWithdrawalReceipt,
    claimWithdrawalReceiptError,
    claimWithdrawalError,
    isReadyToClaim,
  } = useClaimTransaction(withdrawal)
  const [operationStatus, setOperationStatus] = useContext(
    ToEvmWithdrawalContext,
  )
  const t = useTranslations('tunnel-page.submit-button')

  const isClaiming = operationStatus === 'claiming'

  useEffect(
    function clearAfterSuccessfulClaim() {
      if (
        claimWithdrawalReceipt?.status !== 'success' ||
        operationStatus !== 'claiming'
      ) {
        return
      }
      setOperationStatus('idle')
    },
    [claimWithdrawalReceipt, operationStatus, setOperationStatus],
  )

  useEffect(
    function handleUserRejection() {
      if (claimWithdrawalError && isClaiming) {
        setOperationStatus('rejected')
      }
    },
    [claimWithdrawalError, isClaiming, setOperationStatus],
  )

  useEffect(
    function handleTransactionFailure() {
      if (claimWithdrawalReceiptError && isClaiming) {
        setOperationStatus('failed')
      }
    },
    [claimWithdrawalReceiptError, isClaiming, setOperationStatus],
  )

  const handleClaim = function (e: FormEvent) {
    e.preventDefault()
    setOperationStatus('claiming')
    claimWithdrawal()
  }

  const getText = function () {
    if (isClaiming) {
      return 'claiming-withdrawal'
    }
    if (['failed', 'rejected'].includes(operationStatus)) {
      return 'try-again'
    }
    return 'claim-withdrawal'
  }

  return (
    <DrawerCallToAction
      expectedChainId={withdrawal.l1ChainId}
      onSubmit={handleClaim}
      submitButton={
        <Button disabled={!isReadyToClaim || isClaiming} type="submit">
          {t(getText())}
        </Button>
      }
    />
  )
}
