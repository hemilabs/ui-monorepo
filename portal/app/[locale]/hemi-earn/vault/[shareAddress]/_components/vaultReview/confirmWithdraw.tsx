import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { type FormEvent, useState } from 'react'
import { useTranslations } from 'use-intl'
import { getExtraApprovalAmount } from 'utils/approval'

import { applySlippage } from '../../../../_constants/slippage'
import { percentToBps } from '../../../../_utils/slippage'
import { useVaultForm } from '../../_context/vaultFormContext'
import { useQuoteRedeem } from '../../_hooks/useQuoteRedeem'
import { useSharesToAssets } from '../../_hooks/useSharesToAssets'
import { useSlippage } from '../../_hooks/useSlippage'
import { useWithdraw } from '../../_hooks/useWithdraw'
import { type WithdrawOperationRunning } from '../../_types/operations'

const getLabelKey = function ({
  isApproving,
  isRetry,
  isWithdrawing,
}: {
  isApproving: boolean
  isRetry: boolean
  isWithdrawing: boolean
}) {
  if (isApproving) return 'common.approving'
  if (isWithdrawing) return 'hemi-earn.vault.form.withdrawing'
  return isRetry
    ? 'common.try-again'
    : 'hemi-earn.vault.drawer.confirm-in-wallet'
}

export const ConfirmWithdraw = function ({ shares }: { shares: bigint }) {
  const [operationRunning, setOperationRunning] =
    useState<WithdrawOperationRunning>('idle')

  const {
    approveExtraAmount,
    resetStateAfterOperation,
    selectedAsset,
    updateWithdrawOperation,
    vault,
    withdrawOperation,
  } = useVaultForm()

  const t = useTranslations()
  const slippage = useSlippage('withdraw')
  const slippageBps = percentToBps(slippage)

  const {
    data: { assetOut, peggedAmount } = {
      assetOut: BigInt(0),
      peggedAmount: BigInt(0),
    },
  } = useSharesToAssets({
    assetAddress: selectedAsset.address,
    shareAddress: vault.shareAddress,
    shares,
  })

  const assetsOutMin =
    assetOut > BigInt(0) ? applySlippage(assetOut, slippageBps) : BigInt(0)

  const { data: quote } = useQuoteRedeem({
    asset: selectedAsset.address,
    shareAddress: vault.shareAddress,
    shares,
  })

  const { mutate: runWithdraw } = useWithdraw({
    approvalAmount: getExtraApprovalAmount(shares, approveExtraAmount),
    assetsOutMin,
    callbackFee: quote?.callbackFee ?? BigInt(0),
    isInstant: quote?.isInstant ?? false,
    on(emitter) {
      emitter.on('pre-approve', () => setOperationRunning('approving'))
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
      emitter.on('quote-failed', () => setOperationRunning('failed'))
      emitter.on('withdraw-failed', () => setOperationRunning('failed'))
      emitter.on('withdraw-failed-validation', () =>
        setOperationRunning('failed'),
      )
      emitter.on('unexpected-error', () => setOperationRunning('failed'))
      emitter.on('withdraw-transaction-succeeded', function () {
        setOperationRunning('idle')
        resetStateAfterOperation()
      })
    },
    peggedAmount,
    priorApprovalTxHash: withdrawOperation?.approvalTxHash,
    selectedAsset,
    shares,
    slippage,
    // Hide the specific failed row once this retry is signed (transactionHash is the failed redeem's hash).
    supersedesInitiateTxHash: withdrawOperation?.transactionHash,
    updateWithdrawOperation,
    vault,
  })

  const isApproving = operationRunning === 'approving'
  const isWithdrawing = operationRunning === 'withdrawing'

  const canSubmit = !!quote && shares > BigInt(0) && assetOut > BigInt(0)
  const isRetry = withdrawOperation !== undefined

  const handleSubmit = function (e: FormEvent) {
    e.preventDefault()
    if (isApproving || isWithdrawing || !canSubmit) return
    setOperationRunning('withdrawing')
    runWithdraw(undefined, {
      onError: () => setOperationRunning('idle'),
    })
  }

  return (
    <form className="flex w-full [&>button]:w-full" onSubmit={handleSubmit}>
      <SubmitWhenConnected
        submitButton={
          <Button
            disabled={isApproving || isWithdrawing || !canSubmit}
            size="small"
          >
            {t(getLabelKey({ isApproving, isRetry, isWithdrawing }))}
          </Button>
        }
        submitButtonSize="small"
      />
    </form>
  )
}
