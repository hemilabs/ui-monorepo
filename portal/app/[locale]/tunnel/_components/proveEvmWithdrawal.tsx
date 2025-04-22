'use client'

import { Button } from 'components/button'
import { useTranslations } from 'next-intl'
import { type FormEvent, useContext } from 'react'
import { MessageStatus, ToEvmWithdrawOperation } from 'types/tunnel'

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
  const { mutate: proveWithdrawal } = useProveTransaction({
    on(emitter) {
      emitter.on('user-signed-prove-error', () =>
        setOperationStatus('rejected'),
      )
      emitter.on('prove-transaction-succeeded', () =>
        setOperationStatus('idle'),
      )
      emitter.on('prove-transaction-reverted', () =>
        setOperationStatus('failed'),
      )
      emitter.on('unexpected-error', () => setOperationStatus('failed'))
    },
    withdrawal,
  })
  const t = useTranslations('tunnel-page.submit-button')

  const isProving = operationStatus === 'proving'

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

  const isReadyToProve = withdrawal.status === MessageStatus.READY_TO_PROVE

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
