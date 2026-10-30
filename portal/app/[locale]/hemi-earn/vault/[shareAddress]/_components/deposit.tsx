import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { SetMaxEvmBalance } from 'components/setMaxBalance'
import { TokenInput } from 'components/tokenInput'
import { WarningBox } from 'components/warningBox'
import { getHemiEarnRouterAddress } from 'hemi-earn-actions'
import { useTokenBalance } from 'hooks/useBalance'
import { useState } from 'react'
import { type EvmToken } from 'types/token'
import { useTranslations } from 'use-intl'
import { getExtraApprovalAmount } from 'utils/approval'
import { getNativeToken } from 'utils/nativeToken'
import { parseTokenUnits } from 'utils/token'
import { validateSubmit } from 'utils/validateSubmit'
import { walletIsConnected } from 'utils/wallet'
import { useAccount as useEvmAccount } from 'wagmi'

import { RenderEarnFiatBalance } from '../../../_components/earnFiatBalance'
import { useCanDeposit } from '../../../_hooks/useCanDeposit'
import { useIsCooldownEligible } from '../../../_hooks/useIsCooldownEligible'
import { percentToBps } from '../../../_utils/slippage'
import { useVaultForm } from '../_context/vaultFormContext'
import { useDeposit } from '../_hooks/useDeposit'
import { useDepositPreview } from '../_hooks/useDepositPreview'
import { useDrawerQueryString } from '../_hooks/useDrawerQueryString'
import { useSlippage } from '../_hooks/useSlippage'
import { type DepositOperationRunning } from '../_types/operations'
import {
  computeIsLoading,
  resolveErrorKey,
  resolvePreviewIssue,
  resolveValidationError,
  resolveZeroNativeBalanceError,
} from '../_utils/formState'

import { AdvancedSettings } from './advancedSettings'
import { AssetSelector } from './assetSelector'
import { VaultFormLayout } from './form'
import { OperationBelowForm } from './operationBelowForm'
import { SubmitDeposit } from './submitDeposit'
import { VaultFormContent } from './vaultFormContent'

type Props = {
  onSwitchToWithdraw: VoidFunction
}

export const Deposit = function ({ onSwitchToWithdraw }: Props) {
  const t = useTranslations()
  const [operationRunning, setOperationRunning] =
    useState<DepositOperationRunning>('idle')

  const {
    approveExtraAmount,
    input,
    resetStateAfterOperation,
    selectedAsset,
    updateDepositOperation,
    updateInput,
    vault,
  } = useVaultForm()

  const { address, status } = useEvmAccount()
  const depositGate = useCanDeposit()

  const amount = parseTokenUnits(input, selectedAsset.token)
  const routerAddress = getHemiEarnRouterAddress()
  const slippage = useSlippage('deposit')
  const slippageBps = percentToBps(slippage)
  const extraApprovalAmount = getExtraApprovalAmount(amount, approveExtraAmount)

  const { data: walletTokenBalance, isSuccess: tokenBalanceLoaded } =
    useTokenBalance(selectedAsset.token.chainId, selectedAsset.address)

  const {
    canSubmit: validInput,
    error: validationError,
    errorKey,
  } = validateSubmit({
    amountInput: input,
    balance: walletTokenBalance,
    operation: 'deposit',
    t,
    token: selectedAsset.token,
  })

  // Fail-safe: assume the cooldown applies while eligibility loads/errors, so we don't imply an instant withdraw.
  const { data: isCooldownEligible = true } = useIsCooldownEligible({
    account: address,
    stakingVault: vault.stakingVault,
  })

  const {
    bridgingFee,
    canDeposit,
    depositGasFees,
    ethereumFee,
    hemiGasFee,
    isAllowanceError,
    isAllowanceLoading,
    isFeesError,
    isPreviewError,
    isPreviewLoading,
    layerZeroFee,
    needsApproval,
    quote,
    shares,
    sharesOutMin,
    totalFees,
  } = useDepositPreview({
    account: address,
    amount,
    approvalAmount: extraApprovalAmount ?? amount,
    asset: selectedAsset.address,
    shareAddress: vault.shareAddress,
    slippageBps,
    spender: routerAddress,
    token: selectedAsset.token,
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

  const { setDrawerQueryString } = useDrawerQueryString()

  const { isPending: isRunningOperation, mutate: deposit } = useDeposit({
    approvalAmount: extraApprovalAmount,
    callbackFee: quote?.callbackFee ?? BigInt(0),
    input,
    on(emitter) {
      // Open the drawer on first signature — wired here, not in useDeposit, so the hook stays reusable off the vault page (home retry has no drawer).
      emitter.on('user-signed-approval', () =>
        setDrawerQueryString('depositing'),
      )
      emitter.on('user-signed-deposit', () =>
        setDrawerQueryString('depositing'),
      )
      emitter.on('approve-transaction-succeeded', () =>
        setOperationRunning('depositing'),
      )
      emitter.on('deposit-transaction-succeeded', function () {
        resetStateAfterOperation()
      })
      emitter.on('deposit-settled', () => setOperationRunning('idle'))
    },
    selectedAsset,
    sharesOutMin,
    slippage,
    updateDepositOperation,
    vault,
  })

  const handleDeposit = function () {
    if (!canDeposit || !quote || zeroBalanceError) {
      return
    }
    deposit(undefined, {
      onError: () => setOperationRunning('idle'),
    })
    setOperationRunning(needsApproval ? 'approving' : 'depositing')
  }

  const hasQuote = !!quote

  const previewIssue = resolvePreviewIssue({
    hasShares: !!shares,
    isPreviewError,
    isPreviewLoading,
    peggedAmount: quote?.peggedAmount,
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
    tokenBalanceLoaded,
    errorKey,
  )
  const isSubmitLoading = computeIsLoading({
    balanceLoaded: tokenBalanceLoaded,
    isAllowanceLoading,
    isNativeBalancePending,
    isPreviewLoading,
    validInput,
  })

  if (!depositGate.canDeposit) {
    return (
      <VaultFormLayout
        formContent={
          <VaultFormContent
            activeTab="deposit"
            onSwitchTab={onSwitchToWithdraw}
          >
            <WarningBox subheading={t(`hemi-earn.${depositGate.reason}`)} />
          </VaultFormContent>
        }
      />
    )
  }

  return (
    <VaultFormLayout
      aboveSubmit={<WarningBox subheading={t('hemi-earn.risk-warning')} />}
      belowForm={
        canDeposit && (
          <OperationBelowForm
            account={address}
            bridgingFee={bridgingFee}
            ethereumFee={ethereumFee}
            hemiGasFee={hemiGasFee}
            isCooldownEligible={isCooldownEligible}
            isFeesError={isFeesError}
            nativeToken={nativeToken}
            stakingVault={vault.stakingVault}
            topRow={{
              amount: shares,
              label: t('hemi-earn.vault.form.you-will-receive'),
              token: vault.shareToken,
            }}
            totalFees={totalFees}
          />
        )
      }
      formContent={
        <VaultFormContent activeTab="deposit" onSwitchTab={onSwitchToWithdraw}>
          <TokenInput
            disabled={isRunningOperation}
            errorKey={displayedErrorKey}
            fiatBalanceComponent={RenderEarnFiatBalance}
            headerAction={
              <AdvancedSettings
                disabled={isRunningOperation}
                operation="deposit"
              />
            }
            label={t('common.deposit')}
            maxBalanceButton={
              <SetMaxEvmBalance
                disabled={isRunningOperation}
                gas={depositGasFees + layerZeroFee}
                onSetMaxBalance={updateInput}
                token={selectedAsset.token}
              />
            }
            onChange={updateInput}
            token={selectedAsset.token}
            tokenSelector={
              <AssetSelector disabled={isRunningOperation} vault={vault} />
            }
            value={input}
          />
        </VaultFormContent>
      }
      onSubmit={handleDeposit}
      submitButton={
        <SubmitDeposit
          canDeposit={canDeposit && hasQuote}
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
