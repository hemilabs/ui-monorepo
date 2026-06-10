'use client'

import { getHemiEarnRouterAddress } from 'hemi-earn-actions'
import { useTokenBalance } from 'hooks/useBalance'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import dynamic from 'next/dynamic'
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
import { useDeposit } from '../_hooks/useDeposit'
import { useDepositFees } from '../_hooks/useDepositFees'
import { useDepositShares } from '../_hooks/useDepositShares'
import { useDrawerQueryString } from '../_hooks/useDrawerQueryString'
import { useQuoteDeposit } from '../_hooks/useQuoteDeposit'
import { type DepositOperationRunning } from '../_types/operations'
import {
  computeIsLoading,
  resolveErrorKey,
  resolvePreviewIssue,
  resolveValidationError,
} from '../_utils/formState'

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

const computeHemiGasFee = (
  depositGasFees: bigint,
  approvalGasFees: bigint,
  needsApproval: boolean,
) => depositGasFees + (needsApproval ? approvalGasFees : BigInt(0))

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

  const { isAllowanceError, isAllowanceLoading, needsApproval } =
    useNeedsApproval({
      address: selectedAsset.address,
      amount,
      chainId: selectedAsset.token.chainId,
      spender: routerAddress,
    })

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

  // Fail safe: when the eligibility read on Ethereum is in-flight or errors,
  // assume the cooldown applies so the warning shows. Silently hiding it
  // would let the user sign a deposit thinking instant withdraw is available.
  const { data: isCooldownEligible = true } = useIsCooldownEligible({
    account: address,
    shareAddress: pool.shareAddress,
  })

  const {
    data: quote,
    isError: isQuoteError,
    isLoading: isQuoteLoading,
  } = useQuoteDeposit({
    amount,
    asset: selectedAsset.address,
    shareAddress: pool.shareAddress,
  })

  const {
    data: shares,
    isError: isSharesError,
    isLoading: isSharesLoading,
  } = useDepositShares({
    amount,
    asset: selectedAsset.address,
    shareAddress: pool.shareAddress,
  })

  const {
    approvalGasFees,
    canDeposit,
    depositGasFees,
    isFeesError,
    layerZeroFee,
    sharesOutMin,
    totalFees,
  } = useDepositFees({
    amount,
    asset: selectedAsset.address,
    isQuoteError,
    needsApproval,
    quote,
    receiver: address,
    shares,
    spender: routerAddress,
    token: selectedAsset.token,
    validInput,
  })

  const { setDrawerQueryString } = useDrawerQueryString()

  const { isPending: isRunningOperation, mutate: deposit } = useDeposit({
    callbackFee: quote?.callbackFee ?? BigInt(0),
    input,
    on(emitter) {
      // Open the pool drawer as soon as the user signs anything — wired
      // here (rather than inside `useDeposit`) so the hook stays reusable
      // outside the pool page (the home retry calls it without a drawer
      // to open).
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
  const hemiGasFee = computeHemiGasFee(
    depositGasFees,
    approvalGasFees,
    needsApproval,
  )
  const hasQuote = !!quote
  const isPreviewLoading = isQuoteLoading || isSharesLoading

  const previewIssue = resolvePreviewIssue({
    hasShares: !!shares,
    isPreviewError: isQuoteError || isSharesError,
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
            bridgingFee={layerZeroFee}
            hemiGasFee={hemiGasFee}
            isCooldownEligible={isCooldownEligible}
            isFeesError={isFeesError}
            nativeToken={nativeToken}
            shareAddress={pool.shareAddress}
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
        <PoolFormContent
          activeTab="deposit"
          errorKey={displayedErrorKey}
          inputLabel={t('common.deposit')}
          inputToken={selectedAsset.token}
          isRunningOperation={isRunningOperation}
          onSwitchTab={onSwitchToWithdraw}
          setMaxBalanceButton={
            <SetMaxEvmBalance
              disabled={isRunningOperation}
              gas={depositGasFees + layerZeroFee}
              onSetMaxBalance={updateInput}
              token={selectedAsset.token}
            />
          }
        />
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
