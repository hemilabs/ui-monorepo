import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { type FormEvent, useState } from 'react'
import { useTranslations } from 'use-intl'
import { formatUnits } from 'viem'

import {
  defaultDepositSlippage,
  applySlippage,
} from '../../../_constants/slippage'
import { percentToBps, resolveRetrySlippage } from '../../../_utils/slippage'
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
  transaction: EarnTransaction
  vault: EarnVault
}

// Retry CTA in the historical deposit drawer; on user-signed-deposit it redirects
// earnTxId to the new tx so the drawer transitions in place from FAILED to in-flight.
export const RetryFailedDeposit = function ({
  asset,
  transaction,
  vault,
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
