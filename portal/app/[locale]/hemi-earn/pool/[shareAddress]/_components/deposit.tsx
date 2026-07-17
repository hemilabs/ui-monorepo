'use client'

import { TokenInput } from 'components/tokenInput'
import { getHemiEarnRouterAddress } from 'hemi-earn-actions'
import { useTokenBalance } from 'hooks/useBalance'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { type EvmToken } from 'types/token'
import { getNativeToken } from 'utils/nativeToken'
import { parseTokenUnits } from 'utils/token'
import { validateSubmit } from 'utils/validateSubmit'
import { walletIsConnected } from 'utils/wallet'
import { useAccount as useEvmAccount } from 'wagmi'

import { RenderEarnFiatBalance } from '../../../_components/earnFiatBalance'
import { useIsCooldownEligible } from '../../../_hooks/useIsCooldownEligible'
import { usePoolForm } from '../_context/poolFormContext'
import { useDeposit } from '../_hooks/useDeposit'
import { useDepositPreview } from '../_hooks/useDepositPreview'
import { useDrawerQueryString } from '../_hooks/useDrawerQueryString'
import { type DepositOperationRunning } from '../_types/operations'
import {
  computeIsLoading,
  resolveErrorKey,
  resolvePreviewIssue,
  resolveValidationError,
} from '../_utils/formState'

import { AssetSelector } from './assetSelector'
import { VaultFormLayout } from './form'
import { OperationBelowForm } from './operationBelowForm'
import { PoolFormContent } from './poolFormContent'
import { SubmitDeposit } from './submitDeposit'

const SetMaxEvmBalance = dynamic(
  () => import('components/setMaxBalance').then(mod => mod.SetMaxEvmBalance),
  { ssr: false },
)

type Props = {
  onSwitchToWithdraw: VoidFunction
}

export const Deposit = function ({ onSwitchToWithdraw }: Props) {
  const t = useTranslations()
  const [operationRunning, setOperationRunning] =
    useState<DepositOperationRunning>('idle')

  const {
    input,
    pool,
    resetStateAfterOperation,
    selectedAsset,
    updateDepositOperation,
    updateInput,
  } = usePoolForm()

  const { address, status } = useEvmAccount()

  const amount = parseTokenUnits(input, selectedAsset.token)
  const routerAddress = getHemiEarnRouterAddress()

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
    stakingVault: pool.stakingVault,
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
    asset: selectedAsset.address,
    shareAddress: pool.shareAddress,
    spender: routerAddress,
    token: selectedAsset.token,
    validInput,
  })

  const { setDrawerQueryString } = useDrawerQueryString()

  const { isPending: isRunningOperation, mutate: deposit } = useDeposit({
    callbackFee: quote?.callbackFee ?? BigInt(0),
    input,
    on(emitter) {
      // Open the drawer on first signature — wired here, not in useDeposit, so the hook stays reusable off the pool page (home retry has no drawer).
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
    pool,
    selectedAsset,
    sharesOutMin,
    updateDepositOperation,
  })

  const handleDeposit = function () {
    if (!canDeposit || !quote) {
      return
    }
    deposit(undefined, {
      onError: () => setOperationRunning('idle'),
    })
    setOperationRunning(needsApproval ? 'approving' : 'depositing')
  }

  const nativeToken = getNativeToken(selectedAsset.token.chainId) as EvmToken
  const hasQuote = !!quote

  const previewIssue = resolvePreviewIssue({
    hasShares: !!shares,
    isPreviewError,
    isPreviewLoading,
    peggedAmount: quote?.peggedAmount,
    validInput,
  })
  const effectiveValidationError = resolveValidationError(
    previewIssue ? t(`hemi-earn.pool.form.${previewIssue}`) : undefined,
    validationError,
  )
  const displayedErrorKey = resolveErrorKey(
    walletIsConnected(status),
    tokenBalanceLoaded,
    errorKey,
  )
  const isSubmitLoading = computeIsLoading({
    balanceLoaded: tokenBalanceLoaded,
    isAllowanceLoading,
    isPreviewLoading,
    validInput,
  })

  return (
    <VaultFormLayout
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
            stakingVault={pool.stakingVault}
            topRow={{
              amount: shares,
              label: t('hemi-earn.pool.form.you-will-receive'),
              token: pool.shareToken,
            }}
            totalFees={totalFees}
          />
        )
      }
      formContent={
        <PoolFormContent activeTab="deposit" onSwitchTab={onSwitchToWithdraw}>
          <TokenInput
            disabled={isRunningOperation}
            errorKey={displayedErrorKey}
            fiatBalanceComponent={RenderEarnFiatBalance}
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
              <AssetSelector disabled={isRunningOperation} pool={pool} />
            }
            value={input}
          />
        </PoolFormContent>
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
