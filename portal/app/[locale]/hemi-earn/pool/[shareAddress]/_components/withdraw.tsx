'use client'

import { getHemiEarnRouterAddress } from 'hemi-earn-actions'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { type EvmToken } from 'types/token'
import { getNativeToken } from 'utils/nativeToken'
import { parseTokenUnits } from 'utils/token'
import { validateSubmit } from 'utils/validateSubmit'
import { walletIsConnected } from 'utils/wallet'
import { useAccount as useEvmAccount } from 'wagmi'

import { useIsCooldownEligible } from '../../../_hooks/useIsCooldownEligible'
import { usePoolForm } from '../_context/poolFormContext'
import { useUserShareValue } from '../_hooks/useUserShareValue'
import { useWithdraw } from '../_hooks/useWithdraw'
import { useWithdrawPreview } from '../_hooks/useWithdrawPreview'
import { type WithdrawOperationRunning } from '../_types/operations'
import {
  computeIsLoading,
  resolveErrorKey,
  resolvePreviewIssue,
  resolveValidationError,
} from '../_utils/formState'

import { VaultFormLayout } from './form'
import { OperationBelowForm } from './operationBelowForm'
import { PoolFormContent } from './poolFormContent'
import { SubmitWithdraw } from './submitWithdraw'
import { UserPoolBalance } from './userPoolBalance'
import { WithdrawMaxBalance } from './withdrawMaxBalance'

export const Withdraw = function ({
  onSwitchToDeposit,
}: {
  onSwitchToDeposit: VoidFunction
}) {
  const t = useTranslations()
  const [operationRunning, setOperationRunning] =
    useState<WithdrawOperationRunning>('idle')

  const {
    input,
    pool,
    resetStateAfterOperation,
    selectedAsset,
    updateInput,
    updateWithdrawOperation,
  } = usePoolForm()

  const { address, status } = useEvmAccount()

  // Input is in share-token units (svetBTC). The Router's `requestRedeem`
  // burns shares directly, so the form mirrors that on-chain unit.
  const shares = parseTokenUnits(input, pool.shareToken)

  const { data: shareValue, isSuccess: shareValueLoaded } = useUserShareValue({
    shareAddress: pool.shareAddress,
  })

  const {
    canSubmit: validInput,
    error: validationError,
    errorKey,
  } = validateSubmit({
    amountInput: input,
    balance: shareValue?.shares,
    operation: 'withdrawal',
    t,
    token: pool.shareToken,
  })

  const routerAddress = getHemiEarnRouterAddress()

  // Single composed query owns shares→assets preview, redeem quote, and
  // allowance reads. `withdraw.tsx` only consumes the derived outputs
  // here — no separate subscriptions for those upstream queries.
  const {
    assetOut,
    assetOutRaw,
    assetsOutMin,
    canWithdraw,
    hemiGasFees,
    isAllowanceError,
    isAllowanceLoading,
    isFeesError,
    isPreviewError,
    isPreviewLoading,
    layerZeroFee,
    needsApproval,
    peggedAmount,
    peggedAmountRaw,
    quote,
    totalFees,
  } = useWithdrawPreview({
    account: address,
    asset: selectedAsset.address,
    shareAddress: pool.shareAddress,
    shares,
    shareToken: pool.shareToken,
    spender: routerAddress,
    validInput,
  })

  // Fail safe: when the eligibility read on Ethereum is in-flight or errors,
  // assume the cooldown applies so the warning shows. Silently hiding it
  // would let the user start a withdraw thinking the funds land instantly.
  const { data: isCooldownEligible = true } = useIsCooldownEligible({
    account: address,
    stakingVault: pool.stakingVault,
  })

  const { callbackFee = BigInt(0), isInstant = false } = quote ?? {}

  const { isPending: isRunningOperation, mutate: withdrawFn } = useWithdraw({
    assetsOutMin,
    callbackFee,
    isInstant,
    on(emitter) {
      emitter.on('approve-transaction-succeeded', () =>
        setOperationRunning('withdrawing'),
      )
      emitter.on('withdraw-transaction-succeeded', function () {
        resetStateAfterOperation()
      })
      emitter.on('withdraw-settled', () => setOperationRunning('idle'))
    },
    peggedAmount,
    pool,
    selectedAsset,
    shares,
    updateWithdrawOperation,
  })

  const handleWithdraw = function () {
    if (!canWithdraw || !quote) {
      return
    }
    withdrawFn(undefined, {
      onError: () => setOperationRunning('idle'),
    })
    setOperationRunning(needsApproval ? 'approving' : 'withdrawing')
  }

  const nativeToken = getNativeToken(selectedAsset.token.chainId) as EvmToken
  const hasQuote = !!quote

  const previewIssue = resolvePreviewIssue({
    hasShares: assetOut > BigInt(0),
    isPreviewError,
    isPreviewLoading,
    peggedAmount,
    validInput,
  })
  const effectiveValidationError = resolveValidationError(
    previewIssue ? t(`hemi-earn.pool.form.${previewIssue}`) : undefined,
    validationError,
  )
  const displayedErrorKey = resolveErrorKey(
    walletIsConnected(status),
    shareValueLoaded,
    errorKey,
  )
  const isSubmitLoading = computeIsLoading({
    balanceLoaded: shareValueLoaded,
    isAllowanceLoading,
    isPreviewLoading,
    validInput,
  })

  return (
    <VaultFormLayout
      belowForm={
        canWithdraw && (
          <OperationBelowForm
            account={address}
            bridgingFee={layerZeroFee}
            hemiGasFee={hemiGasFees}
            isCooldownEligible={isCooldownEligible}
            isFeesError={isFeesError}
            nativeToken={nativeToken}
            stakingVault={pool.stakingVault}
            topRow={{
              amount: assetOutRaw,
              label: t('hemi-earn.pool.form.you-will-receive'),
              token: selectedAsset.token,
            }}
            totalFees={totalFees}
          />
        )
      }
      formContent={
        <PoolFormContent
          aboveInput={<UserPoolBalance />}
          activeTab="withdraw"
          errorKey={displayedErrorKey}
          fiatBalance={{
            // When `shares` is 0n the preview query stays disabled and
            // `peggedAmountRaw` is `undefined` — force 0n here so the
            // fiat row mirrors the deposit's "$0" behaviour for an empty
            // input instead of locking the skeleton on forever.
            balance: shares > BigInt(0) ? peggedAmountRaw : BigInt(0),
            token: pool.peggedToken,
          }}
          inputLabel={t('hemi-earn.pool.form.withdraw-share-tokens-as')}
          inputToken={pool.shareToken}
          isRunningOperation={isRunningOperation}
          onSwitchTab={onSwitchToDeposit}
          setMaxBalanceButton={
            <WithdrawMaxBalance
              disabled={isRunningOperation}
              onSetMaxBalance={updateInput}
            />
          }
        />
      }
      onSubmit={handleWithdraw}
      submitButton={
        <SubmitWithdraw
          canWithdraw={canWithdraw && hasQuote}
          isAllowanceError={isAllowanceError}
          isLoading={isSubmitLoading}
          isRunningOperation={isRunningOperation}
          needsApproval={needsApproval}
          operationRunning={operationRunning}
          validationError={effectiveValidationError}
        />
      }
    />
  )
}
