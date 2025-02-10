import { useUmami } from 'app/analyticsEvents'
import { Button } from 'components/button'
import { WarningBox } from 'components/warningBox'
import { useConfirmBitcoinDeposit } from 'hooks/useBtcTunnel'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useTranslations } from 'next-intl'
import { type FormEvent, useEffect, useState } from 'react'
import { type BtcDepositOperation, BtcDepositStatus } from 'types/tunnel'

import { DrawerCallToAction } from './reviewOperation/drawerCallToAction'

type OperationStatus = 'idle' | 'rejected'

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

  const [networkType] = useNetworkType()
  const [operationStatus, setOperationStatus] =
    useState<OperationStatus>('idle')
  const t = useTranslations()
  const { updateDeposit } = useTunnelHistory()
  const { track } = useUmami()

  const isConfirming =
    deposit.status === BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMING

  // No need to handle the success case, as in that case, this component will be unmounted
  // and nothing gets rendered. But we do want to track in analytics!
  useEffect(
    function trackAnalyticsOnSuccess() {
      if (confirmBitcoinDepositReceipt?.status === 'success') {
        track?.('btc - confirm dep success', { chain: networkType })
      }
    },
    [confirmBitcoinDepositReceipt, networkType, track],
  )

  useEffect(
    function handleUserRejection() {
      if (confirmBitcoinDepositError && isConfirming) {
        setOperationStatus('rejected')
      }
    },
    [confirmBitcoinDepositError, isConfirming, setOperationStatus],
  )

  useEffect(
    function handleTransactionFailure() {
      if (confirmBitcoinDepositReceiptError && isConfirming) {
        updateDeposit(deposit, {
          status: BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMATION_TX_FAILED,
        })
        track?.('btc - confirm dep failed', { chain: networkType })
      }
    },
    [
      confirmBitcoinDepositReceiptError,
      deposit,
      networkType,
      isConfirming,
      track,
      updateDeposit,
    ],
  )

  const isReadyToConfirm = [
    BtcDepositStatus.READY_TO_MANUAL_CONFIRM,
    BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMATION_TX_FAILED,
  ].includes(deposit.status)

  const handleConfirm = function (e: FormEvent) {
    e.preventDefault()
    if (!isReadyToConfirm) {
      return
    }
    updateDeposit(deposit, {
      // clear any past confirmation transaction hashes, in case user is retrying.
      confirmationTransactionHash: undefined,
      status: BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMING,
    })
    confirmBitcoinDeposit()

    track?.('btc - confirm dep started', { chain: networkType })
  }

  const getText = function () {
    if (isConfirming) {
      return 'confirming-deposit-manually'
    }
    if (
      operationStatus === 'rejected' ||
      deposit.status === BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMATION_TX_FAILED
    ) {
      return 'try-again'
    }
    return 'confirm-deposit-manually'
  }

  return (
    <div className="flex h-full flex-col justify-between gap-y-24">
      <WarningBox
        heading={t(
          'tunnel-page.review-deposit.we-could-not-process-this-deposit',
        )}
        subheading={t('tunnel-page.review-deposit.click-to-confirm')}
      />
      <DrawerCallToAction
        expectedChainId={deposit.l2ChainId}
        onSubmit={handleConfirm}
        submitButton={
          <Button disabled={!isReadyToConfirm || isConfirming} type="submit">
            {t(`tunnel-page.submit-button.${getText()}`)}
          </Button>
        }
      />
    </div>
  )
}
