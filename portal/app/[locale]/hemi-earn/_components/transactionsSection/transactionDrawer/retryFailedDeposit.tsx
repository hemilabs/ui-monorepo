'use client'

import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { useTranslations } from 'next-intl'
import { type FormEvent, useState } from 'react'
import { formatUnits } from 'viem'

import {
  DEPOSIT_SLIPPAGE_BPS,
  applySlippage,
} from '../../../_constants/slippage'
import { useDeposit } from '../../../pool/[shareAddress]/_hooks/useDeposit'
import { useDepositShares } from '../../../pool/[shareAddress]/_hooks/useDepositShares'
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

// Retry CTA in the historical deposit drawer; on user-signed-deposit it redirects
// earnTxId to the new tx so the drawer transitions in place from FAILED to in-flight.
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

  const { data: shares } = useDepositShares({
    amount,
    asset: asset.address,
    shareAddress: pool.shareAddress,
  })

  const sharesOutMin = shares
    ? applySlippage(shares, DEPOSIT_SLIPPAGE_BPS)
    : BigInt(0)

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
    priorApprovalTxHash: transaction.approvalTxHash,
    selectedAsset: asset,
    sharesOutMin,
    // Hide the specific failed row from the table once this retry is signed.
    supersedesInitiateTxHash: transaction.requestTxHash,
  })

  const isDepositing = operationRunning === 'depositing'

  const handleRetry = function (e: FormEvent) {
    e.preventDefault()
    if (!quote || !shares || shares <= BigInt(0)) return
    setOperationRunning('depositing')
    runDeposit()
  }

  return (
    <form className="flex w-full [&>button]:w-full" onSubmit={handleRetry}>
      <SubmitWhenConnected
        submitButton={
          <Button
            disabled={isDepositing || !quote || !shares || shares <= BigInt(0)}
            size="small"
          >
            {t(isDepositing ? 'common.depositing' : 'common.try-again')}
          </Button>
        }
        submitButtonSize="small"
      />
    </form>
  )
}
