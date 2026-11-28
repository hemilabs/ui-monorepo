import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { Tooltip } from 'components/tooltip'
import { type FormEvent, useState } from 'react'
import { useTranslations } from 'use-intl'
import { formatUnits } from 'viem'

import {
  defaultDepositSlippage,
  applySlippage,
} from '../../../_constants/slippage'
import { useCanDeposit } from '../../../_hooks/useCanDeposit'
import { useRefreshTermsStep } from '../../../_hooks/useRefreshTermsStep'
import { depositBlockMessageKey } from '../../../_utils/depositGate'
import { percentToBps, resolveRetrySlippage } from '../../../_utils/slippage'
import { type TermsStep } from '../../../_utils/termsGate'
import {
  type EarnAsset,
  type EarnTransaction,
  type EarnVault,
} from '../../../types'
import { useDeposit } from '../../../vault/[shareAddress]/_hooks/useDeposit'
import { useDepositShares } from '../../../vault/[shareAddress]/_hooks/useDepositShares'
import { useQuoteDeposit } from '../../../vault/[shareAddress]/_hooks/useQuoteDeposit'
import { type DepositOperationRunning } from '../../../vault/[shareAddress]/_types/operations'

import { useTxDrawerQueryString } from './useTxDrawerQueryString'

type Props = {
  asset: EarnAsset
  onTermsRequired: VoidFunction
  termsStep: TermsStep | undefined
  transaction: EarnTransaction
  vault: EarnVault
}

// Retry CTA in the historical deposit drawer; on user-signed-deposit it redirects
// earnTxId to the new tx so the drawer transitions in place from FAILED to in-flight.
export const RetryFailedDeposit = function ({
  asset,
  onTermsRequired,
  termsStep,
  transaction,
  vault,
}: Props) {
  const [, setTxDrawerQueryString] = useTxDrawerQueryString()
  const [operationRunning, setOperationRunning] =
    useState<DepositOperationRunning>('idle')
  const t = useTranslations()
  const depositGate = useCanDeposit(vault)
  const refreshTermsStep = useRefreshTermsStep()

  const amount = BigInt(transaction.amountIn)
  const input = formatUnits(amount, asset.token.decimals)

  const { data: quote } = useQuoteDeposit({
    amount,
    asset: asset.address,
    shareAddress: vault.shareAddress,
  })

  const { data: shares } = useDepositShares({
    amount,
    asset: asset.address,
    shareAddress: vault.shareAddress,
  })

  const slippage = resolveRetrySlippage({
    fallback: defaultDepositSlippage,
    slippage: transaction.slippage,
  })

  const sharesOutMin = shares
    ? applySlippage(shares, percentToBps(slippage))
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
    priorApprovalTxHash: transaction.approvalTxHash,
    selectedAsset: asset,
    sharesOutMin,
    slippage,
    // Hide the specific failed row from the table once this retry is signed.
    supersedesInitiateTxHash: transaction.requestTxHash,
    vault,
  })

  const isDepositing = operationRunning === 'depositing'

  const handleRetry = async function (e: FormEvent) {
    e.preventDefault()
    if (
      isDepositing ||
      !depositGate.canDeposit ||
      !quote ||
      !shares ||
      shares <= BigInt(0)
    )
      return
    if (termsStep !== 'accepted') {
      onTermsRequired()
      return
    }

    setOperationRunning('depositing')
    if ((await refreshTermsStep()) !== 'accepted') {
      setOperationRunning('idle')
      onTermsRequired()
      return
    }
    runDeposit()
  }

  return (
    <form
      className="flex w-full *:w-full [&_button]:w-full"
      onSubmit={handleRetry}
    >
      <SubmitWhenConnected
        submitButton={
          <Tooltip
            disabled={depositGate.canDeposit}
            text={
              depositGate.reason &&
              t(depositBlockMessageKey(depositGate.reason))
            }
            variant="simple"
          >
            <Button
              disabled={
                !depositGate.canDeposit ||
                isDepositing ||
                termsStep === undefined ||
                !quote ||
                !shares ||
                shares <= BigInt(0)
              }
              size="small"
            >
              {t(isDepositing ? 'common.depositing' : 'common.try-again')}
            </Button>
          </Tooltip>
        }
        submitButtonSize="small"
      />
    </form>
  )
}
