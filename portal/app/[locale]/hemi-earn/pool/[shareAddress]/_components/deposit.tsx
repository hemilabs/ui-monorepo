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

import { useCooldownDuration } from '../../../_hooks/useCooldownDuration'
import { useIsCooldownEligible } from '../../../_hooks/useIsCooldownEligible'
import { usePoolForm } from '../_context/poolFormContext'
import { useDeposit } from '../_hooks/useDeposit'
import { useDepositFees } from '../_hooks/useDepositFees'
import { useDepositShares } from '../_hooks/useDepositShares'
import { useDrawerQueryString } from '../_hooks/useDrawerQueryString'
import { type DepositOperationRunning } from '../_types/operations'

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
  cooldownDays: number | undefined
  hemiGasFee: bigint
  isCooldownDaysLoading: boolean
  isCooldownEligible: boolean
  isFeesError: boolean
  nativeToken: EvmToken
  shareToken: EvmToken
  shares: bigint | undefined
  totalFees: bigint
}

const BelowForm = ({
  account,
  bridgingFee,
  cooldownDays,
  hemiGasFee,
  isCooldownDaysLoading,
  isCooldownEligible,
  isFeesError,
  nativeToken,
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
      <CooldownWarning days={cooldownDays} isLoading={isCooldownDaysLoading} />
    )}
  </div>
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

  const canDeposit = validInput

  const {
    approvalGasFees,
    depositGasFees,
    isFeesError,
    layerZeroFee,
    quote,
    totalFees,
  } = useDepositFees({
    amount,
    asset: selectedAsset.address,
    canDeposit,
    needsApproval,
    receiver: address,
    shareAddress: pool.shareAddress,
    spender: routerAddress,
    token: selectedAsset.token,
  })

  // Fail safe: when the eligibility read on Ethereum is in-flight or errors,
  // assume the cooldown applies so the warning shows. Silently hiding it
  // would let the user sign a deposit thinking instant withdraw is available.
  const { data: isCooldownEligible = true } = useIsCooldownEligible({
    account: address,
    shareAddress: pool.shareAddress,
  })

  const { data: cooldownDays, isPending: isCooldownDaysLoading } =
    useCooldownDuration({
      shareAddress: pool.shareAddress,
    })

  const { data: shares } = useDepositShares({
    peggedAmount: quote?.peggedAmount,
    shareAddress: pool.shareAddress,
  })

  const { setDrawerQueryString } = useDrawerQueryString()

  const { isPending: isRunningOperation, mutate: deposit } = useDeposit({
    callbackFee: quote?.callbackFee ?? BigInt(0),
    input,
    on(emitter) {
      // Open the pool drawer as soon as the user signs anything — wired here
      // (rather than inside `useDeposit`) so the hook stays reusable outside
      // the pool page (the home retry calls it without a drawer to open).
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
  const hemiGasFee =
    depositGasFees + (needsApproval ? approvalGasFees : BigInt(0))

  return (
    <VaultFormLayout
      belowForm={
        canDeposit && (
          <BelowForm
            account={address}
            bridgingFee={layerZeroFee}
            cooldownDays={cooldownDays}
            hemiGasFee={hemiGasFee}
            isCooldownDaysLoading={isCooldownDaysLoading}
            isCooldownEligible={isCooldownEligible}
            isFeesError={isFeesError}
            nativeToken={nativeToken}
            shareToken={pool.shareToken}
            shares={shares}
            totalFees={totalFees}
          />
        )
      }
      formContent={
        <PoolFormContent
          activeTab="deposit"
          errorKey={
            walletIsConnected(status) && tokenBalanceLoaded
              ? errorKey
              : undefined
          }
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
          canDeposit={canDeposit && !!quote}
          isAllowanceError={isAllowanceError}
          isLoading={
            isAllowanceLoading || !tokenBalanceLoaded || (canDeposit && !quote)
          }
          isRunningOperation={isRunningOperation}
          needsApproval={needsApproval}
          operationRunning={operationRunning}
          validationError={validationError}
        />
      }
    />
  )
}
