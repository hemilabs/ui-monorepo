'use client'

import { Button } from 'components/button'
import { useTranslations } from 'next-intl'
import { type FormEvent, useContext } from 'react'
import { MessageStatus, ToEvmWithdrawOperation } from 'types/tunnel'

import { ToEvmWithdrawalContext } from '../_context/toEvmWithdrawalContext'
import { useClaimTransaction } from '../_hooks/useClaimTransaction'

import { DrawerCallToAction } from './reviewOperation/drawerCallToAction'

type Props = {
  withdrawal: ToEvmWithdrawOperation
}

export const ClaimEvmWithdrawal = function ({ withdrawal }: Props) {
  const [operationStatus, setOperationStatus] = useContext(
    ToEvmWithdrawalContext,
  )

  const { mutate: claimWithdrawal } = useClaimTransaction({
    on(emitter) {
      emitter.on('user-signed-finalize-error', () =>
        setOperationStatus('rejected'),
      )
      emitter.on('finalize-transaction-succeeded', () =>
        setOperationStatus('idle'),
      )
      emitter.on('finalize-transaction-reverted', () =>
        setOperationStatus('failed'),
      )
      emitter.on('unexpected-error', () => setOperationStatus('failed'))
    },
    withdrawal,
  })

  const t = useTranslations('tunnel-page.submit-button')

  const isClaiming = operationStatus === 'claiming'

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

  const isReadyToClaim = withdrawal.status === MessageStatus.READY_FOR_RELAY

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
