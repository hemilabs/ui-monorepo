'use client'

import { EvmFeesSummary } from 'components/evmFeesSummary'
import { getHemiEarnRouterAddress } from 'hemi-earn-actions'
import { useTokenBalance } from 'hooks/useBalance'
import { useChain } from 'hooks/useChain'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { getNativeToken } from 'utils/nativeToken'
import { parseTokenUnits } from 'utils/token'
import { validateSubmit } from 'utils/validateSubmit'
import { walletIsConnected } from 'utils/wallet'
import { formatUnits } from 'viem'
import { useAccount as useEvmAccount } from 'wagmi'

import { usePoolForm } from '../_context/poolFormContext'
import { useDeposit } from '../_hooks/useDeposit'
import { useDepositFees } from '../_hooks/useDepositFees'
import { useDrawerQueryString } from '../_hooks/useDrawerQueryString'
import { type DepositOperationRunning } from '../_types/operations'

import { VaultFormLayout } from './form'
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

  const { depositGasFees, isFeesError, layerZeroFee, quote, totalFees } =
    useDepositFees({
      amount,
      asset: selectedAsset.address,
      canDeposit,
      needsApproval,
      receiver: address,
      shareAddress: pool.shareAddress,
      spender: routerAddress,
      token: selectedAsset.token,
    })

  const { setDrawerQueryString } = useDrawerQueryString()

  const { isPending: isRunningOperation, mutate: deposit } = useDeposit({
    callbackFee: quote?.callbackFee ?? BigInt(0),
    input,
    on(emitter) {
      // Drawer opens only after the deposit tx is signed. Approval
      // happens as a pre-drawer wallet modal, with the form's submit
      // button surfacing the "Approving..." state. Mirrors the tunnel
      // pattern where the approval step is hidden when its tx hash isn't
      // surfaced — here we never surface it. Wired here (rather than
      // inside `useDeposit`) so the hook stays reusable outside the pool
      // page (the home retry calls it without a drawer to open).
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

  const chain = useChain(selectedAsset.token.chainId)
  const nativeToken = getNativeToken(selectedAsset.token.chainId)

  function RenderBelowForm() {
    if (!canDeposit) {
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
