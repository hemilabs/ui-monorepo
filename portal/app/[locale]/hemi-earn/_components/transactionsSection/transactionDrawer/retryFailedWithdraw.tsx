import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { type FormEvent, useState } from 'react'
import { useTranslations } from 'use-intl'

import {
  defaultRedeemSlippage,
  applySlippage,
} from '../../../_constants/slippage'
import { percentToBps, resolveRetrySlippage } from '../../../_utils/slippage'
import {
  type EarnAsset,
  type EarnTransaction,
  type EarnVault,
} from '../../../types'
import { useQuoteRedeem } from '../../../vault/[shareAddress]/_hooks/useQuoteRedeem'
import { useSharesToAssets } from '../../../vault/[shareAddress]/_hooks/useSharesToAssets'
import { useWithdraw } from '../../../vault/[shareAddress]/_hooks/useWithdraw'
import { type WithdrawOperationRunning } from '../../../vault/[shareAddress]/_types/operations'

import { useTxDrawerQueryString } from './useTxDrawerQueryString'

type Props = {
  asset: EarnAsset
  transaction: EarnTransaction
  vault: EarnVault
}

// Retry CTA in the historical withdraw drawer; mirrors RetryFailedDeposit, redirecting earnTxId on user-signed-withdraw.
export const RetryFailedWithdraw = function ({
  asset,
  transaction,
  vault,
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
    shareAddress: vault.shareAddress,
    shares,
  })

  const slippage = resolveRetrySlippage({
    fallback: defaultRedeemSlippage,
    slippage: transaction.slippage,
  })

  const assetsOutMin =
    assetOut > BigInt(0)
      ? applySlippage(assetOut, percentToBps(slippage))
      : BigInt(0)

  const { data: quote } = useQuoteRedeem({
    asset: asset.address,
    shareAddress: vault.shareAddress,
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
    priorApprovalTxHash: transaction.approvalTxHash,
    selectedAsset: asset,
    shares,
    slippage,
    // Hide the specific failed row from the table once this retry is signed.
    supersedesInitiateTxHash: transaction.requestTxHash,
    vault,
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
