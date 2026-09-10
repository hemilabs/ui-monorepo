import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { type FormEvent, useState } from 'react'
import { useTranslations } from 'use-intl'
import { parseTokenUnits } from 'utils/token'

import { applySlippage } from '../../../../_constants/slippage'
import { getExtraApprovalAmount } from '../../../../_utils/approval'
import { percentToBps } from '../../../../_utils/slippage'
import { usePoolForm } from '../../_context/poolFormContext'
import { useDeposit } from '../../_hooks/useDeposit'
import { useDepositShares } from '../../_hooks/useDepositShares'
import { useDrawerQueryString } from '../../_hooks/useDrawerQueryString'
import { useQuoteDeposit } from '../../_hooks/useQuoteDeposit'
import { useSlippage } from '../../_hooks/useSlippage'
import { type DepositOperationRunning } from '../../_types/operations'

export const RetryDeposit = function () {
  const [operationRunning, setOperationRunning] =
    useState<DepositOperationRunning>('idle')

  const {
    approveExtraAmount,
    depositOperation,
    input,
    pool,
    resetStateAfterOperation,
    selectedAsset,
    updateDepositOperation,
  } = usePoolForm()
  const { setDrawerQueryString } = useDrawerQueryString()

  const t = useTranslations()

  const slippage = useSlippage('deposit')
  const slippageBps = percentToBps(slippage)
  const amount = parseTokenUnits(input, selectedAsset.token)
  const { data: quote } = useQuoteDeposit({
    amount,
    asset: selectedAsset.address,
    shareAddress: pool.shareAddress,
  })

  const { data: shares } = useDepositShares({
    amount,
    asset: selectedAsset.address,
    shareAddress: pool.shareAddress,
  })

  const sharesOutMin = shares ? applySlippage(shares, slippageBps) : BigInt(0)

  const { mutate: runDeposit } = useDeposit({
    approvalAmount: getExtraApprovalAmount(amount, approveExtraAmount),
    callbackFee: quote?.callbackFee ?? BigInt(0),
    input,
    on(emitter) {
      emitter.on('user-signed-approval', () =>
        setDrawerQueryString('depositing'),
      )
      emitter.on('user-signed-deposit', () =>
        setDrawerQueryString('depositing'),
      )
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
    priorApprovalTxHash: depositOperation?.approvalTxHash,
    selectedAsset,
    sharesOutMin,
    slippage,
    // Hide the specific failed row once this retry is signed (transactionHash is the failed deposit's hash).
    supersedesInitiateTxHash: depositOperation?.transactionHash,
    updateDepositOperation,
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
