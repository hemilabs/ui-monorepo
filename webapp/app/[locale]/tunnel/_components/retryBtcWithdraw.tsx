'use client'

import { Button } from 'components/button'
import { useWithdrawBitcoin } from 'hooks/useBtcTunnel'
import { useTranslations } from 'next-intl'
import { type FormEvent, useContext, useEffect } from 'react'
import { ToBtcWithdrawOperation } from 'types/tunnel'

import { EvmToBtcWithdrawalContext } from '../_context/evmToBtcWithdrawalContext'

import { DrawerCallToAction } from './reviewOperation/drawerCallToAction'

type Props = {
  withdrawal: ToBtcWithdrawOperation
}

export const RetryBtcWithdraw = function ({ withdrawal }: Props) {
  const [operationStatus, setOperationStatus] = useContext(
    EvmToBtcWithdrawalContext,
  )

  const t = useTranslations('tunnel-page.submit-button')

  const { withdrawBitcoin, withdrawError } = useWithdrawBitcoin()

  const isWithdrawing = operationStatus === 'withdrawing'

  // Success and failure are not needed to be handled here, as a new tx hash is generated, so this component
  // is unmounted and a "new" withdrawal cycle starts
  useEffect(
    function handleUserRejection() {
      if (withdrawError && isWithdrawing) {
        setOperationStatus('rejected')
      }
    },
    [isWithdrawing, setOperationStatus, withdrawError],
  )

  const handleRetry = function (e: FormEvent) {
    e.preventDefault()
    setOperationStatus('withdrawing')
    const { amount, l1ChainId, l2ChainId } = withdrawal

    withdrawBitcoin({
      amount: BigInt(amount),
      l1ChainId,
      l2ChainId,
    })
  }

  return (
    <DrawerCallToAction
      expectedChainId={withdrawal.l2ChainId}
      onSubmit={handleRetry}
      submitButton={
        <Button disabled={isWithdrawing}>
          {t(isWithdrawing ? 'withdrawing' : 'try-again')}
        </Button>
      }
    />
  )
}
