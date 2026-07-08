'use client'

import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { useTranslations } from 'next-intl'
import { type FormEvent, useState } from 'react'

import {
  REDEEM_SLIPPAGE_BPS,
  applySlippage,
} from '../../../_constants/slippage'
import { useQuoteRedeem } from '../../../pool/[shareAddress]/_hooks/useQuoteRedeem'
import { useSharesToAssets } from '../../../pool/[shareAddress]/_hooks/useSharesToAssets'
import { useWithdraw } from '../../../pool/[shareAddress]/_hooks/useWithdraw'
import { type WithdrawOperationRunning } from '../../../pool/[shareAddress]/_types/operations'
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

// Retry CTA in the historical withdraw drawer; mirrors RetryFailedDeposit, redirecting earnTxId on user-signed-withdraw.
export const RetryFailedWithdraw = function ({
  asset,
  pool,
  transaction,
}: Props) {
  const [, setTxDrawerQueryString] = useTxDrawerQueryString()
  const [operationRunning, setOperationRunning] =
    useState<WithdrawOperationRunning>('idle')
  const t = useTranslations()

  // A REDEEM row's amountIn is in share units — exactly what the Router re-burns on retry.
  const shares = BigInt(transaction.amountIn)

  const {
    data: { assetOut, peggedAmount } = {
      assetOut: BigInt(0),
      peggedAmount: BigInt(0),
    },
  } = useSharesToAssets({
    assetAddress: asset.address,
    shareAddress: pool.shareAddress,
    shares,
  })

  const assetsOutMin =
    assetOut > BigInt(0)
      ? applySlippage(assetOut, REDEEM_SLIPPAGE_BPS)
      : BigInt(0)

  const { data: quote } = useQuoteRedeem({
    asset: asset.address,
    shareAddress: pool.shareAddress,
    shares,
  })

  const { mutate: runWithdraw } = useWithdraw({
    assetsOutMin,
    callbackFee: quote?.callbackFee ?? BigInt(0),
    isInstant: quote?.isInstant ?? false,
    on(emitter) {
      emitter.on('approve-transaction-reverted', () =>
        setOperationRunning('failed'),
      )
      emitter.on('withdraw-transaction-reverted', () =>
        setOperationRunning('failed'),
      )
      emitter.on('user-signing-approval-error', () =>
        setOperationRunning('failed'),
      )
      emitter.on('user-signing-withdraw-error', () =>
        setOperationRunning('failed'),
      )
      emitter.on('unexpected-error', () => setOperationRunning('failed'))
      emitter.on('user-signed-withdraw', function (newInitiateTxHash) {
        setTxDrawerQueryString(newInitiateTxHash)
      })
    },
    peggedAmount,
    pool,
    priorApprovalTxHash: transaction.approvalTxHash,
    selectedAsset: asset,
    shares,
    // Hide the specific failed row from the table once this retry is signed.
    supersedesInitiateTxHash: transaction.requestTxHash,
  })

  const isWithdrawing = operationRunning === 'withdrawing'
  const canRetry = !!quote && shares > BigInt(0) && assetOut > BigInt(0)

  const handleRetry = function (e: FormEvent) {
    e.preventDefault()
    if (!canRetry) return
    setOperationRunning('withdrawing')
    runWithdraw()
  }

  return (
    <form className="flex w-full [&>button]:w-full" onSubmit={handleRetry}>
      <SubmitWhenConnected
        submitButton={
          <Button disabled={isWithdrawing || !canRetry} size="small">
            {t(isWithdrawing ? 'common.withdrawing' : 'common.try-again')}
          </Button>
        }
        submitButtonSize="small"
      />
    </form>
  )
}
