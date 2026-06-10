'use client'

import { getHemiEarnRouterAddress } from 'hemi-earn-actions'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
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
import { useQuoteRedeem } from '../_hooks/useQuoteRedeem'
import { useSharesToAssets } from '../_hooks/useSharesToAssets'
import { useUserShareValue } from '../_hooks/useUserShareValue'
import { useWithdraw } from '../_hooks/useWithdraw'
import { useWithdrawFees } from '../_hooks/useWithdrawFees'
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

  // Shares → asset preview drives both the "You'll receive" row and the
  // slippage floor. `peggedAmount` is the intermediate vault unit, used by
  // `useWithdraw` to optimistically drop `totalAssets()` after the redeem
  // mines. Raw values (`assetOutRaw`/`peggedAmountRaw`) stay `undefined`
  // while the query is pending so the summary can show a skeleton; the
  // bigint aliases below are the floored versions consumed by hooks.
  const {
    data: sharesToAssetsData,
    isError: isSharesToAssetsError,
    isLoading: isSharesToAssetsLoading,
  } = useSharesToAssets({
    assetAddress: selectedAsset.address,
    shareAddress: pool.shareAddress,
    shares,
  })

  const { assetOut: assetOutRaw, peggedAmount: peggedAmountRaw } =
    sharesToAssetsData ?? {}
  const assetOut = assetOutRaw ?? BigInt(0)
  const peggedAmount = peggedAmountRaw ?? BigInt(0)

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

  const { isAllowanceError, isAllowanceLoading, needsApproval } =
    useNeedsApproval({
      address: pool.shareAddress,
      amount: shares,
      chainId: pool.shareToken.chainId,
      spender: routerAddress,
    })

  const {
    data: quote,
    isError: isQuoteError,
    isLoading: isQuoteLoading,
  } = useQuoteRedeem({
    account: address,
    asset: selectedAsset.address,
    shareAddress: pool.shareAddress,
    // `useQuoteRedeem` already gates internally on `shares > 0n` via
    // `enabled`, so a `0n` here is enough to skip the request when the
    // form input isn't valid yet.
    shares: validInput ? shares : BigInt(0),
  })

  const {
    assetsOutMin,
    canWithdraw,
    hemiGasFees,
    isFeesError,
    layerZeroFee,
    totalFees,
  } = useWithdrawFees({
    asset: selectedAsset.address,
    assetOut,
    chainId: selectedAsset.token.chainId,
    isQuoteError,
    needsApproval,
    quote,
    receiver: address,
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
    shareAddress: pool.shareAddress,
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
  const isPreviewLoading = [isSharesToAssetsLoading, isQuoteLoading].some(
    Boolean,
  )
  const isPreviewError = [isSharesToAssetsError, isQuoteError].some(Boolean)

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
            shareAddress={pool.shareAddress}
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
