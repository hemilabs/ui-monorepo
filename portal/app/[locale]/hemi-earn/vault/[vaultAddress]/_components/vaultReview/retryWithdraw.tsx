import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { useTranslations } from 'next-intl'
import { type FormEvent, useState } from 'react'

import { useVaultForm } from '../../_context/vaultFormContext'
import { useWithdraw } from '../../_hooks/useWithdraw'
import { type VaultWithdrawOperationRunning } from '../../_types/vaultOperations'

export const RetryWithdraw = function () {
  const [operationRunning, setOperationRunning] =
    useState<VaultWithdrawOperationRunning>('idle')

  const { input, pool, resetStateAfterOperation, updateWithdrawOperation } =
    useVaultForm()

  const t = useTranslations()

  const { mutate: runWithdraw } = useWithdraw({
    input,
    on(emitter) {
      emitter.on('withdraw-transaction-reverted', () =>
        setOperationRunning('failed'),
      )
      emitter.on('user-signing-withdraw-error', () =>
        setOperationRunning('failed'),
      )
      emitter.on('unexpected-error', () => setOperationRunning('failed'))
      emitter.on('withdraw-transaction-succeeded', function () {
        setOperationRunning('idle')
        resetStateAfterOperation()
      })
    },
    pool,
    updateWithdrawOperation,
  })

  const isWithdrawing = operationRunning === 'withdrawing'

  const handleRetry = function (e: FormEvent) {
    e.preventDefault()
    setOperationRunning('withdrawing')
    runWithdraw()
  }

  return (
    <form className="flex w-full [&>button]:w-full" onSubmit={handleRetry}>
      <SubmitWhenConnected
        submitButton={
          <Button disabled={isWithdrawing} size="small">
            {t(
              isWithdrawing
                ? 'hemi-earn.vault.form.withdrawing'
                : 'common.try-again',
            )}
          </Button>
        }
        submitButtonSize="small"
      />
    </form>
  )
}
