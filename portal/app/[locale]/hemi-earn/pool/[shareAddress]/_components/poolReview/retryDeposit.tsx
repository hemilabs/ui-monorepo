import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { useTranslations } from 'next-intl'
import { type FormEvent, useState } from 'react'
import { parseTokenUnits } from 'utils/token'

import { usePoolForm } from '../../_context/poolFormContext'
import { useDeposit } from '../../_hooks/useDeposit'
import { useQuoteDeposit } from '../../_hooks/useQuoteDeposit'
import { type DepositOperationRunning } from '../../_types/operations'

export const RetryDeposit = function () {
  const [operationRunning, setOperationRunning] =
    useState<DepositOperationRunning>('idle')

  const {
    input,
    pool,
    resetStateAfterOperation,
    selectedAsset,
    updateDepositOperation,
  } = usePoolForm()

  const t = useTranslations()

  const amount = parseTokenUnits(input, selectedAsset.token)
  const { data: quote } = useQuoteDeposit({
    amount,
    asset: selectedAsset.address,
    shareAddress: pool.shareAddress,
  })

  const { mutate: runDeposit } = useDeposit({
    fulfillmentFee: quote?.fulfillmentFee ?? BigInt(0),
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
    peggedAmount: quote?.peggedAmount ?? BigInt(0),
    pool,
    selectedAsset,
    updateDepositOperation,
  })

  const isDepositing = operationRunning === 'depositing'

  const handleRetry = function (e: FormEvent) {
    e.preventDefault()
    if (!quote) return
    setOperationRunning('depositing')
    runDeposit()
  }

  return (
    <form className="flex w-full [&>button]:w-full" onSubmit={handleRetry}>
      <SubmitWhenConnected
        submitButton={
          <Button disabled={isDepositing || !quote} size="small">
            {t(isDepositing ? 'common.depositing' : 'common.try-again')}
          </Button>
        }
        submitButtonSize="small"
      />
    </form>
  )
}
