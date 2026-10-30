import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { Tooltip } from 'components/tooltip'
import { type FormEvent, useState } from 'react'
import { useTranslations } from 'use-intl'
import { getExtraApprovalAmount } from 'utils/approval'
import { parseTokenUnits } from 'utils/token'

import { applySlippage } from '../../../../_constants/slippage'
import { useCanDeposit } from '../../../../_hooks/useCanDeposit'
import { percentToBps } from '../../../../_utils/slippage'
import { useVaultForm } from '../../_context/vaultFormContext'
import { useDeposit } from '../../_hooks/useDeposit'
import { useDepositShares } from '../../_hooks/useDepositShares'
import { useQuoteDeposit } from '../../_hooks/useQuoteDeposit'
import { useSlippage } from '../../_hooks/useSlippage'
import { type DepositOperationRunning } from '../../_types/operations'

const getLabelKey = function ({
  isApproving,
  isDepositing,
  isRetry,
}: {
  isApproving: boolean
  isDepositing: boolean
  isRetry: boolean
}) {
  if (isApproving) return 'common.approving'
  if (isDepositing) return 'common.depositing'
  return isRetry
    ? 'common.try-again'
    : 'hemi-earn.vault.drawer.confirm-in-wallet'
}

export const ConfirmDeposit = function () {
  const [operationRunning, setOperationRunning] =
    useState<DepositOperationRunning>('idle')

  const {
    approveExtraAmount,
    depositOperation,
    input,
    resetStateAfterOperation,
    selectedAsset,
    updateDepositOperation,
    vault,
  } = useVaultForm()

  const t = useTranslations()
  const depositGate = useCanDeposit()

  const slippage = useSlippage('deposit')
  const slippageBps = percentToBps(slippage)
  const amount = parseTokenUnits(input, selectedAsset.token)
  const { data: quote } = useQuoteDeposit({
    amount,
    asset: selectedAsset.address,
    shareAddress: vault.shareAddress,
  })

  const { data: shares } = useDepositShares({
    amount,
    asset: selectedAsset.address,
    shareAddress: vault.shareAddress,
  })

  const sharesOutMin = shares ? applySlippage(shares, slippageBps) : BigInt(0)

  const { mutate: runDeposit } = useDeposit({
    approvalAmount: getExtraApprovalAmount(amount, approveExtraAmount),
    callbackFee: quote?.callbackFee ?? BigInt(0),
    input,
    on(emitter) {
      emitter.on('pre-approve', () => setOperationRunning('approving'))
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
    priorApprovalTxHash: depositOperation?.approvalTxHash,
    selectedAsset,
    sharesOutMin,
    slippage,
    // Hide the specific failed row once this retry is signed (transactionHash is the failed deposit's hash).
    supersedesInitiateTxHash: depositOperation?.transactionHash,
    updateDepositOperation,
    vault,
  })

  const isApproving = operationRunning === 'approving'
  const isDepositing = operationRunning === 'depositing'
  const isRetry = depositOperation !== undefined

  const handleSubmit = function (e: FormEvent) {
    e.preventDefault()
    if (!depositGate.canDeposit || !quote || !shares || shares <= BigInt(0))
      return
    setOperationRunning('depositing')
    runDeposit(undefined, {
      onError: () => setOperationRunning('idle'),
    })
  }

  return (
    <form
      className="flex w-full *:w-full [&_button]:w-full"
      onSubmit={handleSubmit}
    >
      <SubmitWhenConnected
        submitButton={
          <Tooltip
            disabled={depositGate.canDeposit}
            text={depositGate.reason && t(`hemi-earn.${depositGate.reason}`)}
            variant="simple"
          >
            <Button
              disabled={
                !depositGate.canDeposit ||
                isApproving ||
                isDepositing ||
                !quote ||
                !shares ||
                shares <= BigInt(0)
              }
              size="small"
            >
              {t(getLabelKey({ isApproving, isDepositing, isRetry }))}
            </Button>
          </Tooltip>
        }
        submitButtonSize="small"
      />
    </form>
  )
}
