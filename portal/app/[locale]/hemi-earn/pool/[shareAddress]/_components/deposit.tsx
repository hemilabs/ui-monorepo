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
import { type Address } from 'viem'
import { useAccount as useEvmAccount } from 'wagmi'

import {
  DEPOSIT_SLIPPAGE_BPS,
  applySlippage,
} from '../../../_constants/slippage'
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

import { CooldownWarning } from './cooldownWarning'
import { DepositSummary } from './depositSummary'
import { VaultFormLayout } from './form'
import { PoolFormContent } from './poolFormContent'
import { SubmitDeposit } from './submitDeposit'

const SetMaxEvmBalance = dynamic(
  () => import('components/setMaxBalance').then(mod => mod.SetMaxEvmBalance),
  { ssr: false },
)

type BelowFormProps = {
  account: Address | undefined
  bridgingFee: bigint
  hemiGasFee: bigint
  isCooldownEligible: boolean
  isFeesError: boolean
  nativeToken: EvmToken
  shareAddress: Address
  shareToken: EvmToken
  shares: bigint | undefined
  totalFees: bigint
}

const BelowForm = ({
  account,
  bridgingFee,
  hemiGasFee,
  isCooldownEligible,
  isFeesError,
  nativeToken,
  shareAddress,
  shares,
  shareToken,
  totalFees,
}: BelowFormProps) => (
  <div className="flex flex-col gap-y-4">
    <div className="px-4">
      <DepositSummary
        bridgingFee={bridgingFee}
        hemiGasFee={hemiGasFee}
        isFeesError={isFeesError}
        nativeToken={nativeToken}
        shareToken={shareToken}
        shares={shares}
        totalFees={totalFees}
      />
    </div>
    {account && isCooldownEligible && (
      <CooldownWarning shareAddress={shareAddress} />
    )}
  </div>
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
    peggedAmount: quote?.peggedAmount,
    shareAddress: pool.shareAddress,
  })

  // Without this, a fast submit before the preview resolves would land
  // `sharesOutMin=0n` on-chain — zero slippage protection.
  const canDeposit = validInput && !!shares && shares > BigInt(0)
  const sharesOutMin = shares
    ? applySlippage(shares, DEPOSIT_SLIPPAGE_BPS)
    : BigInt(0)

  const {
    approvalGasFees,
    depositGasFees,
    isFeesError,
    layerZeroFee,
    totalFees,
  } = useDepositFees({
    amount,
    asset: selectedAsset.address,
    canDeposit,
    needsApproval,
    receiver: address,
    shareAddress: pool.shareAddress,
    sharesOutMin,
    spender: routerAddress,
    token: selectedAsset.token,
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
          <BelowForm
            account={address}
            bridgingFee={layerZeroFee}
            hemiGasFee={hemiGasFee}
            isCooldownEligible={isCooldownEligible}
            isFeesError={isFeesError}
            nativeToken={nativeToken}
            shareAddress={pool.shareAddress}
            shareToken={pool.shareToken}
            shares={shares}
            totalFees={totalFees}
          />
        )
      }
      formContent={
        <PoolFormContent
          activeTab="deposit"
          errorKey={displayedErrorKey}
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
