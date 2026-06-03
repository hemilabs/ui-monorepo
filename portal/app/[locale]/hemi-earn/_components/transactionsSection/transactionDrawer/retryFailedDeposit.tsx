'use client'

import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { useTranslations } from 'next-intl'
import { type FormEvent, useState } from 'react'
import { formatUnits } from 'viem'

import { useDeposit } from '../../../pool/[shareAddress]/_hooks/useDeposit'
import { useQuoteDeposit } from '../../../pool/[shareAddress]/_hooks/useQuoteDeposit'
import { type DepositOperationRunning } from '../../../pool/[shareAddress]/_types/operations'
import {
  type EarnAsset,
  type EarnPool,
  type EarnTransaction,
} from '../../../types'

import { useTxDrawerQueryString } from './useTxDrawerQueryString'

type Props = {
  asset: EarnAsset
  pool: EarnPool
  transaction: EarnTransaction
}

// "Try again" CTA shown inside `<HistoricalDepositReview>` when a deposit
// failed. Reuses `useDeposit` directly — the hook is decoupled from the pool
// drawer (`setDrawerQueryString` is wired by the pool components, not here).
// On `user-signed-deposit`, redirects the drawer's `earnTxId` to the new tx
// hash so the drawer transitions in place from the FAILED view to the new
// in-flight view (instead of closing or going blank).
export const RetryFailedDeposit = function ({
  asset,
  pool,
  transaction,
}: Props) {
  const [, setTxDrawerQueryString] = useTxDrawerQueryString()
  const [operationRunning, setOperationRunning] =
    useState<DepositOperationRunning>('idle')
  const t = useTranslations()

  const amount = BigInt(transaction.amountIn)
  const input = formatUnits(amount, asset.token.decimals)

  const { data: quote } = useQuoteDeposit({
    amount,
    asset: asset.address,
    shareAddress: pool.shareAddress,
  })

  const { mutate: runDeposit } = useDeposit({
    callbackFee: quote?.callbackFee ?? BigInt(0),
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
      emitter.on('user-signed-deposit', function (newInitiateTxHash) {
        setTxDrawerQueryString(newInitiateTxHash)
      })
    },
    pool,
    selectedAsset: asset,
    // Hide the specific failed row from the table once this retry is signed.
    supersedesInitiateTxHash: transaction.initiateTxHash,
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
