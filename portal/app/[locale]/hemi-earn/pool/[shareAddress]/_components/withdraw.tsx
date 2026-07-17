'use client'

import { TokenInput } from 'components/tokenInput'
import { TokenSelectorReadOnly } from 'components/tokenSelector/readonly'
import { getHemiEarnRouterAddress } from 'hemi-earn-actions'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { type EvmToken } from 'types/token'
import { getNativeToken } from 'utils/nativeToken'
import { validateSubmit } from 'utils/validateSubmit'
import { walletIsConnected } from 'utils/wallet'
import { useAccount as useEvmAccount } from 'wagmi'

import { RenderEarnFiatBalance } from '../../../_components/earnFiatBalance'
import { useIsCooldownEligible } from '../../../_hooks/useIsCooldownEligible'
import { usePoolForm } from '../_context/poolFormContext'
import { useAssetsToShares } from '../_hooks/useAssetsToShares'
import { useMaxWithdrawableAsset } from '../_hooks/useMaxWithdrawableAsset'
import { useUserShareValue } from '../_hooks/useUserShareValue'
import { useWithdraw } from '../_hooks/useWithdraw'
import { useWithdrawPreview } from '../_hooks/useWithdrawPreview'
import { type WithdrawOperationRunning } from '../_types/operations'
import {
  resolveErrorKey,
  resolvePreviewIssue,
  resolveValidationError,
} from '../_utils/formState'
import {
  applyWithdrawSharesGuard,
  computeWithdrawSubmitLoading,
  deriveWithdrawShares,
  getTypedAssetAmount,
  getWithdrawValidationTarget,
  resolveRoundToZeroIssue,
  resolveWithdrawInputValues,
  splitWithdrawErrorKey,
} from '../_utils/withdrawForm'

import { AssetSelector } from './assetSelector'
import { VaultFormLayout } from './form'
import { OperationBelowForm } from './operationBelowForm'
import { PoolFormContent } from './poolFormContent'
import { SubmitWithdraw } from './submitWithdraw'
import { WithdrawAvailableBalance } from './withdrawAvailableBalance'
import { WithdrawMaxBalance } from './withdrawMaxBalance'
import { WithdrawShareBalance } from './withdrawShareBalance'

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
    updateAssetInput,
    updateSharesInput,
    updateWithdrawOperation,
    withdrawMode,
  } = usePoolForm()

  const { address, status } = useEvmAccount()

  const isTokensMode = withdrawMode === 'tokens'

  const { data: assetsToShares, isLoading: isAssetsToSharesLoading } =
    useAssetsToShares({
      amount: getTypedAssetAmount({
        input,
        isTokensMode,
        token: selectedAsset.token,
      }),
      assetAddress: selectedAsset.address,
      shareAddress: pool.shareAddress,
    })

  const shares = deriveWithdrawShares({
    assetShares: assetsToShares?.shares,
    input,
    isTokensMode,
    shareToken: pool.shareToken,
  })

  const { data: shareValue, isSuccess: shareValueLoaded } = useUserShareValue({
    shareAddress: pool.shareAddress,
  })
  const shareBalance = shareValue?.shares ?? BigInt(0)

  const { data: maxWithdrawable, isFetched: maxAssetLoaded } =
    useMaxWithdrawableAsset({
      assetAddress: selectedAsset.address,
      shareAddress: pool.shareAddress,
    })
  const maxAssetOut = maxWithdrawable?.assetOut

  const { balance: validationBalance, token: validationToken } =
    getWithdrawValidationTarget({
      assetToken: selectedAsset.token,
      isTokensMode,
      maxAssetOut,
      shareBalance,
      shareToken: pool.shareToken,
    })
  const {
    canSubmit: baseValid,
    error: baseError,
    errorKey: baseErrorKey,
  } = validateSubmit({
    amountInput: input,
    balance: validationBalance,
    operation: 'withdrawal',
    t,
    token: validationToken,
  })
  const { errorKey, validationError, validInput } = applyWithdrawSharesGuard({
    baseError,
    baseErrorKey,
    baseValid,
    insufficientBalanceError: t('common.insufficient-balance', {
      symbol: validationToken.symbol,
    }),
    isTokensMode,
    shareBalance,
    shares,
    shareValueLoaded,
  })

  const routerAddress = getHemiEarnRouterAddress()

  const {
    assetOut,
    assetOutRaw,
    assetsOutMin,
    bridgingFee,
    canWithdraw,
    ethereumFee,
    hemiGasFees,
    isAllowanceError,
    isAllowanceLoading,
    isFeesError,
    isPreviewError,
    isPreviewLoading,
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

  const { assetValue, sharesValue } = resolveWithdrawInputValues({
    assetOut,
    assetToken: selectedAsset.token,
    input,
    isTokensMode,
    shares,
    shareToken: pool.shareToken,
  })

  // Fail-safe: assume the cooldown applies while eligibility loads/errors, so we don't imply an instant withdraw.
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
  const balanceLoaded = isTokensMode ? maxAssetLoaded : shareValueLoaded

  const previewIssue =
    resolveRoundToZeroIssue({
      isAssetsToSharesLoading,
      isTokensMode,
      shares,
      validInput,
    }) ??
    resolvePreviewIssue({
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
    balanceLoaded,
    errorKey,
  )
  const { assetErrorKey, sharesErrorKey } = splitWithdrawErrorKey({
    displayedErrorKey,
    isTokensMode,
  })
  const isSubmitLoading = computeWithdrawSubmitLoading({
    balanceLoaded,
    isAllowanceLoading,
    isAssetsToSharesLoading,
    isPreviewLoading,
    isTokensMode,
    validInput,
  })

  return (
    <VaultFormLayout
      belowForm={
        canWithdraw && (
          <OperationBelowForm
            account={address}
            bridgingFee={bridgingFee}
            ethereumFee={ethereumFee}
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
        <PoolFormContent activeTab="withdraw" onSwitchTab={onSwitchToDeposit}>
          <TokenInput
            balanceComponent={WithdrawShareBalance}
            disabled={isRunningOperation}
            errorKey={sharesErrorKey}
            fiatBalance={{
              // shares 0n keeps the preview disabled (peggedAmountRaw undefined) — force 0n so the fiat row reads "$0", not a stuck skeleton.
              balance: shares > BigInt(0) ? peggedAmountRaw : BigInt(0),
              token: pool.peggedToken,
            }}
            fiatBalanceComponent={RenderEarnFiatBalance}
            label={t('hemi-earn.pool.form.share-token-available-to-withdraw')}
            maxBalanceButton={
              <WithdrawMaxBalance
                disabled={isRunningOperation}
                onSetMaxBalance={updateSharesInput}
              />
            }
            onChange={updateSharesInput}
            token={pool.shareToken}
            tokenSelector={<TokenSelectorReadOnly token={pool.shareToken} />}
            value={sharesValue}
          />
          <TokenInput
            balanceComponent={WithdrawAvailableBalance}
            balanceLabel={t('hemi-earn.pool.form.available')}
            disabled={isRunningOperation}
            errorKey={assetErrorKey}
            fiatBalanceComponent={RenderEarnFiatBalance}
            label={t('hemi-earn.pool.form.withdraw-share-tokens-as')}
            onChange={updateAssetInput}
            token={selectedAsset.token}
            tokenSelector={
              <AssetSelector disabled={isRunningOperation} pool={pool} />
            }
            value={assetValue}
          />
        </PoolFormContent>
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
