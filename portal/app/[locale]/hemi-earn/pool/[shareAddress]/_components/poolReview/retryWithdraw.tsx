import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { useTranslations } from 'next-intl'
import { type FormEvent, useState } from 'react'
import { parseTokenUnits } from 'utils/token'
import { useAccount } from 'wagmi'

import {
  REDEEM_SLIPPAGE_BPS,
  applySlippage,
} from '../../../../_constants/slippage'
import { usePoolForm } from '../../_context/poolFormContext'
import { useAssetsToShares } from '../../_hooks/useAssetsToShares'
import { useQuoteRedeem } from '../../_hooks/useQuoteRedeem'
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
  const { address } = useAccount()
  const amount = parseTokenUnits(input, selectedAsset.token)
  const assetsOutMin =
    amount > BigInt(0) ? applySlippage(amount, REDEEM_SLIPPAGE_BPS) : BigInt(0)

  const {
    data: { peggedAmount, shares } = {
      peggedAmount: BigInt(0),
      shares: BigInt(0),
    },
  } = useAssetsToShares({
    amount,
    assetAddress: selectedAsset.address,
    shareAddress: pool.shareAddress,
  })

  const { data: quote } = useQuoteRedeem({
    account: address,
    asset: selectedAsset.address,
    shareAddress: pool.shareAddress,
    shares,
  })

  const { mutate: runWithdraw } = useWithdraw({
    amount,
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

  const handleRetry = function (e: FormEvent) {
    e.preventDefault()
    if (!quote || shares <= BigInt(0)) return
    setOperationRunning('withdrawing')
    runWithdraw()
  }

  return (
    <form className="flex w-full [&>button]:w-full" onSubmit={handleRetry}>
      <SubmitWhenConnected
        submitButton={
          <Button disabled={isWithdrawing || !quote} size="small">
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
