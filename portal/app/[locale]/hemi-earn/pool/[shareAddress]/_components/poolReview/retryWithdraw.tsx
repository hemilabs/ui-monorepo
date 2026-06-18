import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { useTranslations } from 'next-intl'
import { type FormEvent, useState } from 'react'
import { parseTokenUnits } from 'utils/token'

import {
  REDEEM_SLIPPAGE_BPS,
  applySlippage,
} from '../../../../_constants/slippage'
import { usePoolForm } from '../../_context/poolFormContext'
import { useQuoteRedeem } from '../../_hooks/useQuoteRedeem'
import { useSharesToAssets } from '../../_hooks/useSharesToAssets'
import { useWithdraw } from '../../_hooks/useWithdraw'
import { type WithdrawOperationRunning } from '../../_types/operations'

export const RetryWithdraw = function () {
  const [operationRunning, setOperationRunning] =
    useState<WithdrawOperationRunning>('idle')

  const {
    input,
    pool,
    resetStateAfterOperation,
    selectedAsset,
    updateWithdrawOperation,
    withdrawOperation,
  } = usePoolForm()

  const t = useTranslations()
  // Input is in share-token units (svetBTC); the Router burns shares
  // directly. `assetsOutMin` is derived from the asset preview below.
  const shares = parseTokenUnits(input, pool.shareToken)

  const {
    data: { assetOut, peggedAmount } = {
      assetOut: BigInt(0),
      peggedAmount: BigInt(0),
    },
  } = useSharesToAssets({
    assetAddress: selectedAsset.address,
    shareAddress: pool.shareAddress,
    shares,
  })

  const assetsOutMin =
    assetOut > BigInt(0)
      ? applySlippage(assetOut, REDEEM_SLIPPAGE_BPS)
      : BigInt(0)

  const { data: quote } = useQuoteRedeem({
    asset: selectedAsset.address,
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
      emitter.on('withdraw-transaction-succeeded', function () {
        setOperationRunning('idle')
        resetStateAfterOperation()
      })
    },
    peggedAmount,
    pool,
    priorApprovalTxHash: withdrawOperation?.approvalTxHash,
    selectedAsset,
    shares,
    // Hide the specific failed row from the table when the user commits to
    // this retry. `withdrawOperation.transactionHash` is the failed redeem's
    // hash (set on `user-signed-withdraw` and not cleared by the revert).
    supersedesInitiateTxHash: withdrawOperation?.transactionHash,
    updateWithdrawOperation,
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
            {t(
              isWithdrawing
                ? 'hemi-earn.pool.form.withdrawing'
                : 'common.try-again',
            )}
          </Button>
        }
        submitButtonSize="small"
      />
    </form>
  )
}
