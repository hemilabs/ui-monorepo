'use client'

import { ChainLabel } from 'components/reviewOperation/chainLabel'
import {
  ProgressStatus,
  type ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { useTokenBalance } from 'hooks/useBalance'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useHemi } from 'hooks/useHemi'
import { useHemiToken } from 'hooks/useHemiToken'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import { useTranslations } from 'next-intl'
import { ReactNode, useState } from 'react'
import {
  StakingDashboardStatus,
  type StakingDashboardStatusType,
  type StakingOperationRunning,
} from 'types/stakingDashboard'
import { getTotal } from 'utils/getTotal'
import { getNativeToken } from 'utils/nativeToken'
import { parseTokenUnits } from 'utils/token'
import { validateSubmit } from 'utils/validateSubmit'
import { getVeHemiContractAddress } from 've-hemi-actions'
import { formatUnits } from 'viem'

import { useStakingDashboard } from '../../../_context/stakingDashboardContext'
import { useEstimateIncreaseAmountFees } from '../../../_hooks/useEstimateIncreaseAmountFees'
import { useIncreaseAmount } from '../../../_hooks/useIncreaseAmount'
import { Operation } from '../../operation'

import { Preview } from './preview'
import { RetryIncreaseAmount } from './retryIncreaseAmount'

type Props = {
  onClose: VoidFunction
}

export const ReviewIncreaseAmount = function ({ onClose }: Props) {
  const {
    resetStateAfterOperation,
    stakingDashboardOperation,
    updateStakingDashboardOperation,
  } = useStakingDashboard()
  const token = useHemiToken()

  const [operationRunning, setOperationRunning] =
    useState<StakingOperationRunning>('idle')

  // stakingDashboardOperation and stakingPosition will always be defined here
  const { approvalTxHash, input, stakingPosition, transactionHash } =
    stakingDashboardOperation!
  const { tokenId } = stakingPosition!

  const stakingDashboardStatus =
    stakingDashboardOperation?.status ??
    StakingDashboardStatus.APPROVAL_TX_PENDING

  const t = useTranslations()
  const tDrawer = useTranslations('staking-dashboard.drawer')
  const hemi = useHemi()

  const veHemiAddress = getVeHemiContractAddress(token.chainId)

  const amount = parseTokenUnits(input!, token)

  const { isAllowanceError, isAllowanceLoading, needsApproval } =
    useNeedsApproval({
      address: token.address,
      amount,
      spender: veHemiAddress,
    })

  const { balance: walletTokenBalance } = useTokenBalance(
    token.chainId,
    token.address,
  )

  const {
    canSubmit: validInput,
    error: validationError,
    errorKey,
  } = validateSubmit({
    amountInput: input!,
    balance: walletTokenBalance,
    operation: 'stake',
    t,
    token,
  })

  const approvalFeesEnabled =
    stakingDashboardStatus === StakingDashboardStatus.APPROVAL_TX_FAILED ||
    stakingDashboardStatus === StakingDashboardStatus.APPROVAL_TX_PENDING

  const { fees: approvalTokenGasFees, isError: isApprovalTokenGasFeesError } =
    useEstimateApproveErc20Fees({
      amount,
      enabled: approvalFeesEnabled,
      spender: veHemiAddress,
      token,
    })

  const { fees: increaseAmountFees, isError: isIncreaseAmountFeesError } =
    useEstimateIncreaseAmountFees({
      amount,
      token,
      tokenId: BigInt(tokenId!),
    })

  const getGas = () => ({
    amount: formatUnits(
      increaseAmountFees + (needsApproval ? approvalTokenGasFees : BigInt(0)),
      hemi.nativeCurrency.decimals,
    ),
    isError:
      isIncreaseAmountFeesError ||
      (needsApproval && isApprovalTokenGasFeesError),
    label: t('common.network-gas-fee', { network: hemi.name }),
    token: getNativeToken(hemi.id),
  })

  const getTotalIncreaseAmount = () =>
    getTotal({
      fees:
        increaseAmountFees + (needsApproval ? approvalTokenGasFees : BigInt(0)),
      fromInput: input!,
      fromToken: token,
    })

  const getStepFees = ({
    fee,
    isError,
    show,
  }: {
    fee: bigint
    show: boolean
    isError: boolean
  }): StepPropsWithoutPosition['fees'] =>
    show
      ? {
          amount: formatUnits(fee, hemi.nativeCurrency.decimals),
          isError,
          token: getNativeToken(hemi.id),
        }
      : undefined

  const addApprovalStep = function (): StepPropsWithoutPosition {
    const getStatus = function () {
      if (stakingDashboardStatus === undefined) {
        return ProgressStatus.COMPLETED
      }

      const statusMap: Partial<
        Record<StakingDashboardStatusType, ProgressStatusType>
      > = {
        [StakingDashboardStatus.APPROVAL_TX_FAILED]: ProgressStatus.FAILED,
        [StakingDashboardStatus.APPROVAL_TX_PENDING]: ProgressStatus.PROGRESS,
      }
      return statusMap[stakingDashboardStatus] ?? ProgressStatus.COMPLETED
    }

    return {
      description: (
        <ChainLabel
          active={
            stakingDashboardStatus ===
            StakingDashboardStatus.APPROVAL_TX_PENDING
          }
          chainId={hemi.id}
          label={tDrawer('approving', {
            symbol: token.symbol,
          })}
        />
      ),
      explorerChainId: token.chainId,
      fees: getStepFees({
        fee: approvalTokenGasFees,
        isError: isApprovalTokenGasFeesError,
        show: approvalFeesEnabled,
      }),
      status: getStatus(),
      txHash: approvalTxHash,
    }
  }

  const addIncreaseAmountStep = function (): StepPropsWithoutPosition {
    const getStatus = function () {
      if (stakingDashboardStatus === undefined) {
        return ProgressStatus.NOT_READY
      }
      const statusMap: Record<StakingDashboardStatusType, ProgressStatusType> =
        {
          [StakingDashboardStatus.APPROVAL_TX_PENDING]:
            ProgressStatus.NOT_READY,
          [StakingDashboardStatus.APPROVAL_TX_FAILED]: ProgressStatus.NOT_READY,
          [StakingDashboardStatus.APPROVAL_TX_COMPLETED]: ProgressStatus.READY,
          [StakingDashboardStatus.STAKE_TX_PENDING]: ProgressStatus.PROGRESS,
          [StakingDashboardStatus.STAKE_TX_FAILED]: ProgressStatus.FAILED,
          [StakingDashboardStatus.STAKE_TX_CONFIRMED]: ProgressStatus.COMPLETED,
        }
      return statusMap[stakingDashboardStatus] ?? ProgressStatus.NOT_READY
    }

    const showFees =
      stakingDashboardStatus === StakingDashboardStatus.APPROVAL_TX_COMPLETED ||
      stakingDashboardStatus === StakingDashboardStatus.STAKE_TX_PENDING ||
      stakingDashboardStatus === StakingDashboardStatus.STAKE_TX_FAILED

    return {
      description: (
        <ChainLabel
          active={
            stakingDashboardStatus === StakingDashboardStatus.STAKE_TX_PENDING
          }
          chainId={hemi.id}
          label={tDrawer('stake-token', {
            symbol: token.symbol,
          })}
        />
      ),
      explorerChainId: token.chainId,
      fees: getStepFees({
        fee: increaseAmountFees,
        isError: isIncreaseAmountFeesError,
        show: showFees,
      }),
      status: getStatus(),
      txHash: transactionHash,
    }
  }

  const getSteps = function () {
    const steps: StepPropsWithoutPosition[] = []
    if (needsApproval || approvalTxHash) {
      steps.push(addApprovalStep())
    }
    steps.push(addIncreaseAmountStep())
    return steps
  }

  const getCallToAction = function (callStatus: StakingDashboardStatusType) {
    const map: Partial<Record<StakingDashboardStatusType, ReactNode>> = {
      [StakingDashboardStatus.APPROVAL_TX_FAILED]: <RetryIncreaseAmount />,
      [StakingDashboardStatus.STAKE_TX_FAILED]: <RetryIncreaseAmount />,
    }
    return map[callStatus]
  }

  const { isPending: isRunningOperation, mutate: increaseAmount } =
    useIncreaseAmount({
      input: input!,
      on(emitter) {
        emitter.on('user-signed-approve', () => setOperationRunning('staking'))
        emitter.on('user-signed-increase-amount', () =>
          setOperationRunning('staking'),
        )
        emitter.on('increase-amount-transaction-succeeded', function () {
          resetStateAfterOperation()
        })
        emitter.on('increase-amount-settled', () =>
          setOperationRunning('staked'),
        )
      },
      token,
      tokenId: tokenId!,
      updateStakingDashboardOperation,
    })

  function handleInput(value: string) {
    updateStakingDashboardOperation({
      input: value,
    })
  }

  return (
    <Operation
      amount={amount.toString()}
      callToAction={getCallToAction(stakingDashboardStatus)}
      heading={tDrawer('increase-amount.heading', { symbol: token.symbol })}
      isOperating={operationRunning !== 'idle'}
      onClose={onClose}
      preview={
        <Preview
          errorKey={errorKey}
          gas={getGas()}
          increaseAmountFees={increaseAmountFees}
          input={input!}
          isAllowanceError={isAllowanceError}
          isAllowanceLoading={isAllowanceLoading}
          isRunningOperation={isRunningOperation}
          needsApproval={needsApproval}
          onChange={handleInput}
          onSubmit={increaseAmount}
          operationRunning={operationRunning}
          total={getTotalIncreaseAmount()}
          validInput={validInput}
          validationError={validationError}
        />
      }
      steps={getSteps()}
      subheading={tDrawer('increase-amount.subheading', {
        symbol: token.symbol,
      })}
      token={token}
    />
  )
}
