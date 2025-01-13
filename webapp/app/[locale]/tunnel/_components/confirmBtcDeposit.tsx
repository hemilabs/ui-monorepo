import { Button } from 'components/button'
import { WarningBox } from 'components/warningBox'
import { useConfirmBitcoinDeposit } from 'hooks/useBtcTunnel'
import { useTranslations } from 'next-intl'
import { type FormEvent, useContext, useEffect } from 'react'
import { type BtcDepositOperation, BtcDepositStatus } from 'types/tunnel'

import { BtcToEvmDepositContext } from '../_context/btcToEvmContext'

import { DrawerCallToAction } from './reviewOperation/drawerCallToAction'

type Props = {
  deposit: BtcDepositOperation
}

export const ConfirmBtcDeposit = function ({ deposit }: Props) {
  const {
    confirmBitcoinDeposit,
    confirmBitcoinDepositReceipt,
    confirmBitcoinDepositError,
    confirmBitcoinDepositReceiptError,
  } = useConfirmBitcoinDeposit(deposit)
  const [operationStatus, setOperationStatus] = useContext(
    BtcToEvmDepositContext,
  )
  const t = useTranslations()

  const isClaiming = operationStatus === 'claiming'

  useEffect(
    function clearAfterSuccessfulClaim() {
      if (
        confirmBitcoinDepositReceipt?.status !== 'success' ||
        operationStatus !== 'claiming'
      ) {
        return
      }
      setOperationStatus('idle')
    },
    [confirmBitcoinDepositReceipt, operationStatus, setOperationStatus],
  )

  useEffect(
    function handleUserRejection() {
      if (confirmBitcoinDepositError && isClaiming) {
        setOperationStatus('rejected')
      }
    },
    [confirmBitcoinDepositError, isClaiming, setOperationStatus],
  )

  useEffect(
    function handleTransactionFailure() {
      if (confirmBitcoinDepositReceiptError && isClaiming) {
        setOperationStatus('failed')
      }
    },
    [confirmBitcoinDepositReceiptError, isClaiming, setOperationStatus],
  )

  const isReadyToClaim = deposit.status === BtcDepositStatus.BTC_READY_CLAIM

  const handleClaim = function (e: FormEvent) {
    e.preventDefault()
    if (!isReadyToClaim) {
      return
    }
    confirmBitcoinDeposit()
    setOperationStatus('claiming')
  }

  const getText = function () {
    if (isClaiming) {
      return 'claiming-deposit'
    }
    if (['failed', 'rejected'].includes(operationStatus)) {
      return 'try-again'
    }
    return 'claim-deposit'
  }

  return (
    <div className="flex h-full flex-col justify-between">
      <WarningBox
        heading={t(
          'tunnel-page.review-deposit.we-could-not-process-this-deposit',
        )}
        subheading={t('tunnel-page.review-deposit.click-to-claim')}
      />
      <DrawerCallToAction
        expectedChainId={deposit.l2ChainId}
        onSubmit={handleClaim}
        submitButton={
          <Button disabled={!isReadyToClaim || isClaiming} type="submit">
            {t(`tunnel-page.submit-button.${getText()}`)}
          </Button>
        }
      />
    </div>
  )
}
