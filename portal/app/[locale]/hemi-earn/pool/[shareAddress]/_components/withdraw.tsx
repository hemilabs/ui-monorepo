'use client'

import { EvmFeesSummary } from 'components/evmFeesSummary'
import { getHemiEarnRouterAddress } from 'hemi-earn-actions'
import { useChain } from 'hooks/useChain'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { getNativeToken } from 'utils/nativeToken'
import { parseTokenUnits } from 'utils/token'
import { validateSubmit } from 'utils/validateSubmit'
import { walletIsConnected } from 'utils/wallet'
import { formatUnits } from 'viem'
import { useAccount as useEvmAccount } from 'wagmi'

import { usePoolForm } from '../_context/poolFormContext'
import { useQuoteRedeem } from '../_hooks/useQuoteRedeem'
import { useUserPoolBalance } from '../_hooks/useUserPoolBalance'
import { useWithdraw } from '../_hooks/useWithdraw'
import { useAssetsToShares, useWithdrawFees } from '../_hooks/useWithdrawFees'
import { type WithdrawOperationRunning } from '../_types/operations'
import {
  computeIsLoading,
  resolveErrorKey,
  resolvePreviewIssue,
  resolveValidationError,
} from '../_utils/formState'

import { VaultFormLayout } from './form'
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

  const amount = parseTokenUnits(input, selectedAsset.token)

  const { data: poolBalance, isSuccess: poolBalanceLoaded } =
    useUserPoolBalance({
      assetAddress: selectedAsset.address,
      shareAddress: pool.shareAddress,
    })

  // Input is in asset units (e.g. USDC); the Router takes shares. The hook
  // chains `Gateway.previewDeposit` (asset → peggedToken) and
  // `StakingVault.convertToShares` (peggedToken → shares) to mirror the
  // gateway fee path. Both fall back to zero while the query is pending —
  // `canWithdraw` below gates submission until validation and conversion are
  // ready. `peggedAmount` is forwarded to `useWithdraw` so the optimistic
  // TVL bump happens in vault units (vBTC/vUSD), not the deposit asset's.
  const {
    data: { peggedAmount, shares } = {
      peggedAmount: BigInt(0),
      shares: BigInt(0),
    },
    isError: isAssetsToSharesError,
    isLoading: isAssetsToSharesLoading,
  } = useAssetsToShares({
    amount,
    assetAddress: selectedAsset.address,
    shareAddress: pool.shareAddress,
  })

  const {
    canSubmit: validInput,
    error: validationError,
    errorKey,
  } = validateSubmit({
    amountInput: input,
    balance: poolBalance?.assetOut,
    operation: 'withdrawal',
    t,
    token: selectedAsset.token,
  })

  const routerAddress = getHemiEarnRouterAddress()

  const { isAllowanceError, isAllowanceLoading, needsApproval } =
    useNeedsApproval({
      address: pool.shareAddress,
      amount: shares,
      chainId: selectedAsset.token.chainId,
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
    shares: validInput && shares > BigInt(0) ? shares : BigInt(0),
  })

  const { assetsOutMin, canWithdraw, isFeesError, totalFees } = useWithdrawFees(
    {
      amount,
      asset: selectedAsset.address,
      chainId: selectedAsset.token.chainId,
      isQuoteError,
      needsApproval,
      quote,
      receiver: address,
      shares,
      shareToken: pool.shareToken,
      spender: routerAddress,
      validInput,
    },
  )

  const { isPending: isRunningOperation, mutate: withdrawFn } = useWithdraw({
    amount,
    assetsOutMin,
    callbackFee: quote?.callbackFee ?? BigInt(0),
    isInstant: quote?.isInstant ?? false,
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

  const chain = useChain(selectedAsset.token.chainId)
  const nativeToken = getNativeToken(selectedAsset.token.chainId)

  const hasQuote = !!quote
  const isPreviewLoading = isAssetsToSharesLoading || isQuoteLoading

  const previewIssue = resolvePreviewIssue({
    hasShares: shares > BigInt(0),
    isPreviewError: isAssetsToSharesError || isQuoteError,
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
    poolBalanceLoaded,
    errorKey,
  )
  const isSubmitLoading = computeIsLoading({
    balanceLoaded: poolBalanceLoaded,
    isAllowanceLoading,
    isPreviewLoading,
    validInput,
  })

  function RenderBelowForm() {
    if (!canWithdraw) {
      return null
    }
    return (
      <div className="px-4">
        <EvmFeesSummary
          gas={{
            amount: formatUnits(
              totalFees,
              chain?.nativeCurrency.decimals ?? 18,
            ),
            isError: isFeesError,
            label: t('hemi-earn.pool.form.total-fee'),
            token: nativeToken,
          }}
          operationToken={nativeToken}
        />
      </div>
    )
  }

  return (
    <VaultFormLayout
      belowForm={<RenderBelowForm />}
      formContent={
        <PoolFormContent
          activeTab="withdraw"
          balanceComponent={UserPoolBalance}
          errorKey={displayedErrorKey}
          isRunningOperation={isRunningOperation}
          onSwitchTab={onSwitchToDeposit}
          setMaxBalanceButton={
            <WithdrawMaxBalance
              disabled={isRunningOperation}
              onSetMaxBalance={updateInput}
              token={selectedAsset.token}
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
