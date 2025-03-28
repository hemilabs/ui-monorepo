import { useQueryClient } from '@tanstack/react-query'
import { useUmami } from 'app/analyticsEvents'
import { useBalance } from 'btc-wallet/hooks/useBalance'
import { Button } from 'components/button'
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
  const { queryKey: btcBalanceQueryKey } = useBalance()
  const queryClient = useQueryClient()

  const isConfirming =
    deposit.status === BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMING

  useEffect(
    function handleTransactionSuccess() {
      if (confirmBitcoinDepositReceipt?.status === 'success') {
        // This is needed to invalidate the balance query
        // so the balance is updated in the UI instantly
        queryClient.invalidateQueries({ queryKey: btcBalanceQueryKey })
        track?.('btc - confirm dep success', { chain: networkType })
      }
    },
    [
      btcBalanceQueryKey,
      confirmBitcoinDepositReceipt,
      networkType,
      queryClient,
      track,
    ],
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
    <DrawerCallToAction
      expectedChainId={deposit.l2ChainId}
      onSubmit={handleConfirm}
      submitButton={
        <Button disabled={!isReadyToConfirm || isConfirming} type="submit">
          {t(`tunnel-page.submit-button.${getText()}`)}
        </Button>
      }
    />
  )
}
