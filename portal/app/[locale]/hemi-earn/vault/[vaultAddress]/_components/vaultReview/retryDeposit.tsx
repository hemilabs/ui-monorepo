import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { useTranslations } from 'next-intl'
import { type FormEvent, useState } from 'react'

import { useVaultForm } from '../../_context/vaultFormContext'
import { useDeposit } from '../../_hooks/useDeposit'
import { type VaultDepositOperationRunning } from '../../_types/vaultOperations'

export const RetryDeposit = function () {
  const [operationRunning, setOperationRunning] =
    useState<VaultDepositOperationRunning>('idle')

  const { input, pool, resetStateAfterOperation, updateDepositOperation } =
    useVaultForm()

  const t = useTranslations()

  const { mutate: runDeposit } = useDeposit({
    input,
    on(emitter) {
      emitter.on('approve-transaction-reverted', () =>
        setOperationRunning('failed'),
      )
      emitter.on('deposit-transaction-reverted', () =>
        setOperationRunning('failed'),
      )
      emitter.on('user-signing-approval-error', () =>
        setOperationRunning('failed'),
      )
      emitter.on('user-signing-deposit-error', () =>
        setOperationRunning('failed'),
      )
      emitter.on('unexpected-error', () => setOperationRunning('failed'))
      emitter.on('deposit-transaction-succeeded', function () {
        setOperationRunning('idle')
        resetStateAfterOperation()
      })
    },
    pool,
    updateDepositOperation,
  })

  const isDepositing = operationRunning === 'depositing'

  const handleRetry = function (e: FormEvent) {
    e.preventDefault()
    setOperationRunning('depositing')
    runDeposit()
  }

  return (
    <form className="flex w-full [&>button]:w-full" onSubmit={handleRetry}>
      <SubmitWhenConnected
        submitButton={
          <Button disabled={isDepositing} size="small">
            {t(
              isDepositing
                ? 'hemi-earn.vault.form.depositing'
                : 'common.try-again',
            )}
          </Button>
        }
        submitButtonSize="small"
      />
    </form>
  )
}
