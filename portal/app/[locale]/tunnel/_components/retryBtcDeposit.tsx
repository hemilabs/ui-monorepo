import { Button } from 'components/button'
import { useDepositBitcoin } from 'hooks/useBtcTunnel'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'
import { type FormEvent, useEffect, useState } from 'react'
import { BtcDepositOperation, BtcDepositStatus } from 'types/tunnel'
import { useAccount } from 'wagmi'

import { DrawerCallToAction } from './reviewOperation/drawerCallToAction'

type OperationStatus = 'idle' | 'rejected'

type Props = {
  deposit: BtcDepositOperation
}

export const RetryBtcDeposit = function ({ deposit }: Props) {
  const { address } = useAccount()
  const { depositBitcoin, depositError, depositReceiptError } =
    useDepositBitcoin()
  const t = useTranslations('tunnel-page.submit-button')
  const [operationStatus, setOperationStatus] =
    useState<OperationStatus>('idle')
  const { track } = useUmami()

  const isDepositing = deposit.status === BtcDepositStatus.BTC_TX_PENDING

  // Success and failure are not needed to be handled here, as a new tx hash is generated, so this component
  // is unmounted and a "new" withdrawal cycle starts
  useEffect(
    function handleUserRejection() {
      if (depositError && isDepositing) {
        setOperationStatus('rejected')
      }
    },
    [depositError, isDepositing, setOperationStatus],
  )

  useEffect(
    function handleTxFailure() {
      if (depositReceiptError && isDepositing) {
        track?.('btc - dep failed')
      }
    },
    [depositReceiptError, isDepositing, track],
  )

  const handleRetry = function (e: FormEvent) {
    e.preventDefault()

    depositBitcoin({
      hemiAddress: address,
      l1ChainId: deposit.l1ChainId,
      l2ChainId: deposit.l2ChainId,
      satoshis: Number(deposit.amount),
    })
    track?.('btc - dep started')
  }

  const getText = function () {
    if (isDepositing) {
      return 'depositing'
    }
    if (
      operationStatus === 'rejected' ||
      deposit.status === BtcDepositStatus.BTC_TX_FAILED
    ) {
      return 'try-again'
    }
    return 'deposit'
  }

  return (
    <DrawerCallToAction
      expectedChainId={deposit.l1ChainId}
      onSubmit={handleRetry}
      submitButton={
        <Button disabled={isDepositing} size="small">
          {t(getText())}
        </Button>
      }
    />
  )
}
