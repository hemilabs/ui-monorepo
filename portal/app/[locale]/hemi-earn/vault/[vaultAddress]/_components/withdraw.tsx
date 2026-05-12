'use client'

import { EvmFeesSummary } from 'components/evmFeesSummary'
import { getHemiEarnRouterAddress } from 'hemi-earn-actions'
import { encodeRequestRedeem } from 'hemi-earn-actions/actions'
import { useChain } from 'hooks/useChain'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { getNativeToken } from 'utils/nativeToken'
import { parseTokenUnits } from 'utils/token'
import { validateSubmit } from 'utils/validateSubmit'
import { walletIsConnected } from 'utils/wallet'
import { type Address, formatUnits } from 'viem'
import { useAccount as useEvmAccount, useEstimateGas } from 'wagmi'

import { useVaultForm } from '../_context/vaultFormContext'
import { useUserVaultBalance } from '../_hooks/useUserVaultBalance'
import { useWithdraw } from '../_hooks/useWithdraw'
import { type VaultWithdrawOperationRunning } from '../_types/vaultOperations'

import { VaultFormLayout } from './form'
import { SubmitWithdraw } from './submitWithdraw'
import { UserVaultBalance } from './userVaultBalance'
import { VaultFormContent } from './vaultFormContent'
import { WithdrawMaxBalance } from './withdrawMaxBalance'

type Props = {
  onSwitchToDeposit: VoidFunction
}

export const Withdraw = function ({ onSwitchToDeposit }: Props) {
  const t = useTranslations()
  const [operationRunning, setOperationRunning] =
    useState<VaultWithdrawOperationRunning>('idle')

  const {
    input,
    pool,
    resetStateAfterOperation,
    updateInput,
    updateWithdrawOperation,
  } = useVaultForm()

  const { address, status } = useEvmAccount()

  const amount = parseTokenUnits(input, pool.token)

  const { data: vaultBalance, isSuccess: vaultBalanceLoaded } =
    useUserVaultBalance(pool.vaultAddress, pool.token.chainId)

  const {
    canSubmit: validInput,
    error: validationError,
    errorKey,
  } = validateSubmit({
    amountInput: input,
    balance: vaultBalance,
    operation: 'withdrawal',
    t,
    token: pool.token,
  })

  const canWithdraw = validInput
  const routerAddress = getHemiEarnRouterAddress()

  // TODO(phase-2): the input here is forwarded to `requestRedeem` as the
  // `shares` argument, but the UX should be in asset units (hemiBTC, WBTC,
  // cbBTC) — users do not think in shares. Read the share price from the
  // StakingVault on Ethereum to (a) display the user's share balance as
  // asset, and (b) convert the entered asset amount back to shares before
  // submitting.
  //
  // TODO(phase-2): `requestRedeem` is payable with `msg.value = nativeFee`
  // from `quoteRedeem`. The gas estimate omits that value; once the quote
  // is consumed in the UI, feed it as `value` here and surface the
  // LayerZero fee separately from the network gas.
  const { data: withdrawGasUnits, isError: isWithdrawGasUnitsError } =
    useEstimateGas({
      data:
        canWithdraw && address
          ? encodeRequestRedeem({
              asset: pool.vaultAddress,
              fulfillmentFee: BigInt(0),
              receiver: address,
              shares: amount,
            })
          : undefined,
      query: { enabled: canWithdraw && !!address },
      to: routerAddress as Address,
    })

  const { fees: withdrawGasFees, isError: isWithdrawGasFeesError } =
    useEstimateFees({
      chainId: pool.token.chainId,
      gasUnits: withdrawGasUnits,
      isGasUnitsError: isWithdrawGasUnitsError,
    })

  const { isPending: isRunningOperation, mutate: withdrawFn } = useWithdraw({
    input,
    on(emitter) {
      emitter.on('withdraw-transaction-succeeded', function () {
        resetStateAfterOperation()
      })
      emitter.on('withdraw-settled', () => setOperationRunning('idle'))
    },
    pool,
    updateWithdrawOperation,
  })

  const handleWithdraw = function () {
    if (!canWithdraw) {
      return
    }
    withdrawFn(undefined, {
      onError: () => setOperationRunning('idle'),
    })
    setOperationRunning('withdrawing')
  }

  const chain = useChain(pool.token.chainId)
  const nativeToken = getNativeToken(pool.token.chainId)

  function RenderBelowForm() {
    if (!canWithdraw) {
      return null
    }
    return (
      <div className="px-4">
        <EvmFeesSummary
          gas={{
            amount: formatUnits(
              withdrawGasFees,
              chain?.nativeCurrency.decimals ?? 18,
            ),
            isError: isWithdrawGasFeesError,
            label: t('common.network-gas-fee', { network: chain?.name ?? '' }),
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
        <VaultFormContent
          activeTab="withdraw"
          balanceComponent={UserVaultBalance}
          errorKey={
            walletIsConnected(status) && vaultBalanceLoaded
              ? errorKey
              : undefined
          }
          isRunningOperation={isRunningOperation}
          onSwitchTab={onSwitchToDeposit}
          setMaxBalanceButton={
            <WithdrawMaxBalance
              disabled={isRunningOperation}
              onSetMaxBalance={updateInput}
              token={pool.token}
            />
          }
        />
      }
      onSubmit={handleWithdraw}
      submitButton={
        <SubmitWithdraw
          canWithdraw={canWithdraw}
          isRunningOperation={isRunningOperation}
          operationRunning={operationRunning}
          validationError={validationError}
        />
      }
    />
  )
}
