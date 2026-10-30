import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { TokenInput } from 'components/tokenInput'
import { TokenSelectorReadOnly } from 'components/tokenSelector/readonly'
import { getHemiEarnRouterAddress } from 'hemi-earn-actions'
import { type EvmToken } from 'types/token'
import { useTranslations } from 'use-intl'
import { getExtraApprovalAmount } from 'utils/approval'
import { getNativeToken } from 'utils/nativeToken'
import { validateSubmit } from 'utils/validateSubmit'
import { walletIsConnected } from 'utils/wallet'
import { useAccount as useEvmAccount } from 'wagmi'

import { RenderEarnFiatBalance } from '../../../_components/earnFiatBalance'
import { useIsCooldownEligible } from '../../../_hooks/useIsCooldownEligible'
import { percentToBps } from '../../../_utils/slippage'
import { useVaultForm } from '../_context/vaultFormContext'
import { useAssetsToShares } from '../_hooks/useAssetsToShares'
import { useDrawerQueryString } from '../_hooks/useDrawerQueryString'
import { useMaxWithdrawableAsset } from '../_hooks/useMaxWithdrawableAsset'
import { useSlippage } from '../_hooks/useSlippage'
import { useUserShareValue } from '../_hooks/useUserShareValue'
import { useWithdrawPreview } from '../_hooks/useWithdrawPreview'
import { WithdrawStatus, type WithdrawStatusType } from '../_types/operations'
import {
  resolveErrorKey,
  resolvePreviewIssue,
  resolveValidationError,
  resolveZeroNativeBalanceError,
} from '../_utils/formState'
import { isOperationInFlight } from '../_utils/reviewState'
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

import { AdvancedSettings } from './advancedSettings'
import { AssetSelector } from './assetSelector'
import { VaultFormLayout } from './form'
import { OperationBelowForm } from './operationBelowForm'
import { SubmitWithdraw } from './submitWithdraw'
import { VaultFormContent } from './vaultFormContent'
import { WithdrawAvailableBalance } from './withdrawAvailableBalance'
import { WithdrawMaxBalance } from './withdrawMaxBalance'
import { WithdrawShareBalance } from './withdrawShareBalance'

const inFlightStatuses: WithdrawStatusType[] = [
  WithdrawStatus.APPROVAL_TX_PENDING,
  WithdrawStatus.APPROVAL_TX_COMPLETED,
  WithdrawStatus.WITHDRAW_TX_PENDING,
]

export const Withdraw = function ({
  onSwitchToDeposit,
}: {
  onSwitchToDeposit: VoidFunction
}) {
  const t = useTranslations()

  const {
    approveExtraAmount,
    input,
    selectedAsset,
    updateAssetInput,
    updateSharesInput,
    updateWithdrawOperation,
    vault,
    withdrawMode,
    withdrawOperation,
  } = useVaultForm()

  const slippage = useSlippage('withdraw')
  const slippageBps = percentToBps(slippage)

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
      shareAddress: vault.shareAddress,
    })

  const shares = deriveWithdrawShares({
    assetShares: assetsToShares?.shares,
    input,
    isTokensMode,
    shareToken: vault.shareToken,
  })

  const { data: shareValue, isSuccess: shareValueLoaded } = useUserShareValue({
    shareAddress: vault.shareAddress,
  })
  const shareBalance = shareValue?.shares ?? BigInt(0)

  const { data: maxWithdrawable, isFetched: maxAssetLoaded } =
    useMaxWithdrawableAsset({
      assetAddress: selectedAsset.address,
      shareAddress: vault.shareAddress,
    })
  const maxAssetOut = maxWithdrawable?.assetOut

  const { balance: validationBalance, token: validationToken } =
    getWithdrawValidationTarget({
      assetToken: selectedAsset.token,
      isTokensMode,
      maxAssetOut,
      shareBalance,
      shareToken: vault.shareToken,
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
  const extraApprovalAmount = getExtraApprovalAmount(shares, approveExtraAmount)

  const {
    assetOut,
    assetOutRaw,
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
    approvalAmount: extraApprovalAmount ?? shares,
    asset: selectedAsset.address,
    shareAddress: vault.shareAddress,
    shares,
    shareToken: vault.shareToken,
    slippageBps,
    spender: routerAddress,
    validInput,
  })

  const nativeToken = getNativeToken(selectedAsset.token.chainId) as EvmToken
  const { data: nativeTokenBalance, isLoading: isNativeBalancePending } =
    useNativeBalance(selectedAsset.token.chainId)
  const zeroBalanceError = resolveZeroNativeBalanceError({
    nativeBalance: nativeTokenBalance?.value,
    zeroBalanceMessage: t('common.insufficient-balance', {
      symbol: nativeToken.symbol,
    }),
  })

  const { assetValue, sharesValue } = resolveWithdrawInputValues({
    assetOut,
    assetToken: selectedAsset.token,
    input,
    isTokensMode,
    shares,
    shareToken: vault.shareToken,
  })

  // Fail-safe: assume the cooldown applies while eligibility loads/errors, so we don't imply an instant withdraw.
  const { data: isCooldownEligible = true } = useIsCooldownEligible({
    account: address,
    stakingVault: vault.stakingVault,
  })

  const { setDrawerQueryString } = useDrawerQueryString()
  const isRunningOperation = isOperationInFlight({
    inFlightStatuses,
    status: withdrawOperation?.status,
  })

  const handleWithdraw = function () {
    if (!canWithdraw || !quote || zeroBalanceError || isRunningOperation) {
      return
    }
    // Nothing clears a finished operation, so a fresh review has to start from a clean one.
    updateWithdrawOperation(undefined)
    setDrawerQueryString('withdrawing')
  }

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
  const effectiveValidationError = resolveValidationError({
    previewIssueMessage: previewIssue
      ? t(`hemi-earn.vault.form.${previewIssue}`)
      : undefined,
    validationError,
    zeroBalanceError,
  })
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
    isNativeBalancePending,
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
            stakingVault={vault.stakingVault}
            topRow={{
              amount: assetOutRaw,
              label: t('hemi-earn.vault.form.you-will-receive'),
              token: selectedAsset.token,
            }}
            totalFees={totalFees}
          />
        )
      }
      formContent={
        <VaultFormContent activeTab="withdraw" onSwitchTab={onSwitchToDeposit}>
          <TokenInput
            balanceComponent={WithdrawShareBalance}
            disabled={isRunningOperation}
            errorKey={sharesErrorKey}
            fiatBalance={{
              // shares 0n keeps the preview disabled (peggedAmountRaw undefined) — force 0n so the fiat row reads "$0", not a stuck skeleton.
              balance: shares > BigInt(0) ? peggedAmountRaw : BigInt(0),
              token: vault.peggedToken,
            }}
            fiatBalanceComponent={RenderEarnFiatBalance}
            headerAction={
              <AdvancedSettings
                disabled={isRunningOperation}
                operation="withdraw"
              />
            }
            label={t('hemi-earn.vault.form.share-token-available-to-withdraw')}
            maxBalanceButton={
              <WithdrawMaxBalance
                disabled={isRunningOperation}
                onSetMaxBalance={updateSharesInput}
              />
            }
            onChange={updateSharesInput}
            token={vault.shareToken}
            tokenSelector={<TokenSelectorReadOnly token={vault.shareToken} />}
            value={sharesValue}
          />
          <TokenInput
            balanceComponent={WithdrawAvailableBalance}
            balanceLabel={t('hemi-earn.vault.form.available')}
            disabled={isRunningOperation}
            errorKey={assetErrorKey}
            fiatBalanceComponent={RenderEarnFiatBalance}
            label={t('hemi-earn.vault.form.withdraw-share-tokens-as')}
            onChange={updateAssetInput}
            token={selectedAsset.token}
            tokenSelector={
              <AssetSelector disabled={isRunningOperation} vault={vault} />
            }
            value={assetValue}
          />
        </VaultFormContent>
      }
      onSubmit={handleWithdraw}
      submitButton={
        <SubmitWithdraw
          canWithdraw={canWithdraw && hasQuote}
          isAllowanceError={isAllowanceError}
          isLoading={isSubmitLoading}
          isRunningOperation={isRunningOperation}
          needsApproval={needsApproval}
          validationError={effectiveValidationError}
        />
      }
    />
  )
}
