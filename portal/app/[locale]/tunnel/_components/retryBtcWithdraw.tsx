'use client'

import { Button } from 'components/button'
import { useWithdrawBitcoin } from 'hooks/useBtcTunnel'
import { useTranslations } from 'next-intl'
import { type FormEvent, useEffect, useState } from 'react'
import { ToBtcWithdrawOperation } from 'types/tunnel'

import { DrawerCallToAction } from './reviewOperation/drawerCallToAction'

type OperationStatus = 'idle' | 'withdrawing'

type Props = {
  withdrawal: ToBtcWithdrawOperation
}

export const RetryBtcWithdraw = function ({ withdrawal }: Props) {
  const [operation, setOperationStatus] = useState<OperationStatus>('idle')

  const t = useTranslations('tunnel-page.submit-button')

  const { withdrawBitcoin, withdrawError } = useWithdrawBitcoin()

  const isWithdrawing = operation === 'withdrawing'

  // Success and failure are not needed to be handled here, as a new tx hash is generated, so this component
  // is unmounted and a "new" withdrawal cycle starts
  useEffect(
    function handleUserRejection() {
      if (withdrawError && isWithdrawing) {
        setOperationStatus('idle')
      }
    },
    [isWithdrawing, setOperationStatus, withdrawError],
  )

  const handleRetry = function (e: FormEvent) {
    e.preventDefault()
    // once the user confirms the withdraw, the withdrawal will change its state
    // and this component gets unmounted
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
        <Button disabled={isWithdrawing} fontSize="text-mid">
          {t(isWithdrawing ? 'withdrawing' : 'try-again')}
        </Button>
      }
    />
  )
}
