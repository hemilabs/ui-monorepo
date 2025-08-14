'use client'

import { EvmFeesSummary } from 'components/evmFeesSummary'
import { FeesContainer } from 'components/feesContainer'
import { useTokenBalance } from 'hooks/useBalance'
import { useChain } from 'hooks/useChain'
import { useHemi } from 'hooks/useHemi'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import {
  StakingDashboardStatus,
  StakingDashboardToken,
} from 'types/stakingDashboard'
import { getTotal } from 'utils/getTotal'
import { parseTokenUnits } from 'utils/token'
import { validateSubmit } from 'utils/validateSubmit'
import { walletIsConnected } from 'utils/wallet'
import { getVeHemiContractAddress } from 've-hemi-actions'
import { formatUnits } from 'viem'
import { useAccount as useEvmAccount } from 'wagmi'

import { useEstimateCreateLockFees } from '../_hooks/useEstimateCreateLockFees'
import { useStake } from '../_hooks/useStake'
import {
  StakingDashboardStake,
  TypedStakingDashboardState,
} from '../_hooks/useStakingDashboardState'
import { daysToSeconds } from '../_utils/lockCreationTimes'

import { FormContent, StakingForm } from './form'
import { isValidLockup } from './lockup'
import { StakeToast } from './stakeToast'
import { SubmitStake } from './submitStake'

const SetMaxEvmBalance = dynamic(
  () => import('components/setMaxBalance').then(mod => mod.SetMaxEvmBalance),
  { ssr: false },
)

type OperationRunning = 'idle' | 'approving' | 'staking'

type StakeProps = {
  state: TypedStakingDashboardState<StakingDashboardStake>
  token: StakingDashboardToken
}

export const Stake = function ({ state, token }: StakeProps) {
  const t = useTranslations()
  // use this to be able to show state boxes before user confirmation (mutation isn't finished)
  const [operationRunning, setOperationRunning] =
    useState<OperationRunning>('idle')
  const [extendedErc20Approval, setExtendedErc20Approval] = useState(false)

  const {
    input,
    lockupDays,
    resetStateAfterOperation,
    stakingDashboardOperation,
    updateInput,
    updateStakingDashboardOperation,
  } = state

  const { chain, status } = useEvmAccount()
  const expectedChain = useChain(token.chainId)

  const hemi = useHemi()

  const amount = parseTokenUnits(input, token)

  const bridgeAddress = getVeHemiContractAddress(token.chainId)

  const { isAllowanceError, isAllowanceLoading, needsApproval } =
    useNeedsApproval({
      address: token.address,
      amount,
      spender: bridgeAddress,
    })

  const { balance: walletTokenBalance, isSuccess: tokenBalanceLoaded } =
    useTokenBalance(token.chainId, token.address)

  const {
    canSubmit: canStake,
    error: validationError,
    errorKey,
  } = validateSubmit({
    amountInput: input,
    balance: walletTokenBalance,
    chainId: chain?.id,
    expectedChain: expectedChain.name,
    operation: 'stake',
    t,
    token,
  })

  const { fees: createLockGasFees, isError: isCreateLockFeesError } =
    useEstimateCreateLockFees({
      amount,
      enabled: !needsApproval && canStake,
      lockDurationInSeconds: daysToSeconds(lockupDays),
      token,
    })

  const getGas = () => ({
    amount: formatUnits(createLockGasFees, token.decimals),
    isError: isCreateLockFeesError,
    label: t('common.network-gas-fee', { network: hemi.name }),
    token,
  })

  const getTotalStake = () =>
    getTotal({
      fees: createLockGasFees,
      fromInput: input,
      fromToken: token,
    })

  const { isPending: isRunningOperation, mutate: stake } = useStake({
    extendedErc20Approval,
    input,
    lockupDays,
    on(emitter) {
      emitter.on('approve-transaction-succeeded', () =>
        setOperationRunning('staking'),
      )
      emitter.on('lock-creation-transaction-succeeded', function () {
        resetStateAfterOperation()
        setExtendedErc20Approval(false)
      })
      emitter.on('lock-creation-settled', () => setOperationRunning('idle'))
    },
    token,
    updateStakingDashboardOperation,
  })

  const handleStake = function () {
    stake()
    if (needsApproval) {
      setOperationRunning('approving')
    } else {
      setOperationRunning('staking')
    }
  }

  function RenderBelowForm() {
    if (!canStake || needsApproval) return null

    return (
      <FeesContainer>
        <EvmFeesSummary
          gas={getGas()}
          operationToken={token}
          total={getTotalStake()}
        />
      </FeesContainer>
    )
  }

  const RenderSubmitButton = () => (
    <SubmitStake
      canStake={canStake && isValidLockup(lockupDays)}
      isAllowanceError={isAllowanceError}
      isAllowanceLoading={isAllowanceLoading}
      isRunningOperation={isRunningOperation}
      needsApproval={needsApproval}
      operationRunning={operationRunning}
      token={token}
      validationError={validationError}
    />
  )

  return (
    <>
      {stakingDashboardOperation?.status ===
        StakingDashboardStatus.STAKE_TX_CONFIRMED &&
        stakingDashboardOperation.transactionHash && (
          <StakeToast
            transactionHash={stakingDashboardOperation.transactionHash}
          />
        )}
      <StakingForm
        belowForm={<RenderBelowForm />}
        formContent={
          <FormContent
            errorKey={
              walletIsConnected(status) && tokenBalanceLoaded
                ? errorKey
                : undefined
            }
            isRunningOperation={isRunningOperation}
            setMaxBalanceButton={
              <SetMaxEvmBalance
                disabled={isRunningOperation}
                gas={createLockGasFees}
                onSetMaxBalance={maxBalance => updateInput(maxBalance)}
                token={token}
              />
            }
            stakingDashboardState={state}
            token={token}
          />
        }
        onSubmit={handleStake}
        submitButton={<RenderSubmitButton />}
      />
    </>
  )
}
