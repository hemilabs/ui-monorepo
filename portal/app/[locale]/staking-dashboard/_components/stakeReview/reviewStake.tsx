'use client'

import { ChainLabel } from 'components/reviewOperation/chainLabel'
import {
  ProgressStatus,
  type ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useHemi } from 'hooks/useHemi'
import { useHemiToken } from 'hooks/useHemiToken'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import { useTranslations } from 'next-intl'
import {
  StakingDashboardStatus,
  type StakingDashboardStatusType,
} from 'types/stakingDashboard'
import { getNativeToken } from 'utils/nativeToken'
import { parseTokenUnits } from 'utils/token'
import { getVeHemiContractAddress } from 've-hemi-actions'
import { formatUnits } from 'viem'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { useEstimateCreateLockFees } from '../../_hooks/useEstimateCreateLockFees'
import { daysToSeconds } from '../../_utils/lockCreationTimes'
import { Operation } from '../operation'

import { RetryStake } from './retryStake'

type Props = {
  onClose: VoidFunction
}

export const ReviewStake = function ({ onClose }: Props) {
  const { input, lockupDays, stakingDashboardOperation } = useStakingDashboard()
  const token = useHemiToken()

  const stakingStatus =
    stakingDashboardOperation?.status ??
    StakingDashboardStatus.APPROVAL_TX_COMPLETED

  const t = useTranslations('staking-dashboard.drawer')
  const hemi = useHemi()

  const veHemiAddress = getVeHemiContractAddress(token.chainId)

  const amount = parseTokenUnits(input, token)

  const { needsApproval } = useNeedsApproval({
    address: token.address,
    amount,
    chainId: token.chainId,
    spender: veHemiAddress,
  })

  const { fees: approvalTokenGasFees, isError: isApprovalTokenGasFeesError } =
    useEstimateApproveErc20Fees({
      amount,
      enabled: [
        StakingDashboardStatus.APPROVAL_TX_FAILED,
        StakingDashboardStatus.APPROVAL_TX_PENDING,
      ].includes(stakingStatus),
      spender: veHemiAddress,
      token,
    })

  const { fees: createLockGasFees, isError: isCreateLockFeesError } =
    useEstimateCreateLockFees({
      amount,
      lockDurationInSeconds: BigInt(daysToSeconds(lockupDays)),
      token,
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
    const showFees = [
      StakingDashboardStatus.APPROVAL_TX_FAILED,
      StakingDashboardStatus.APPROVAL_TX_PENDING,
    ].includes(stakingStatus)

    const statusMap: Partial<
      Record<StakingDashboardStatusType, ProgressStatusType>
    > = {
      [StakingDashboardStatus.APPROVAL_TX_FAILED]: ProgressStatus.FAILED,
      [StakingDashboardStatus.APPROVAL_TX_PENDING]: ProgressStatus.PROGRESS,
    }

    const getStatus = function () {
      if (stakingStatus === undefined) {
        return ProgressStatus.COMPLETED
      }
      return statusMap[stakingStatus] ?? ProgressStatus.COMPLETED
    }

    return {
      description: (
        <ChainLabel
          active={stakingStatus === StakingDashboardStatus.APPROVAL_TX_PENDING}
          chainId={hemi.id}
          label={t('approving', { symbol: token.symbol })}
        />
      ),
      explorerChainId: token.chainId,
      fees: getStepFees({
        fee: approvalTokenGasFees,
        isError: isApprovalTokenGasFeesError,
        show: showFees,
      }),
      status: getStatus(),
      txHash: stakingDashboardOperation?.approvalTxHash,
    }
  }

  const addStakingStep = function (): StepPropsWithoutPosition {
    const statusMap: Record<StakingDashboardStatusType, ProgressStatusType> = {
      [StakingDashboardStatus.APPROVAL_TX_PENDING]: ProgressStatus.NOT_READY,
      [StakingDashboardStatus.APPROVAL_TX_FAILED]: ProgressStatus.NOT_READY,
      [StakingDashboardStatus.APPROVAL_TX_COMPLETED]: ProgressStatus.READY,
      [StakingDashboardStatus.STAKE_TX_PENDING]: ProgressStatus.PROGRESS,
      [StakingDashboardStatus.STAKE_TX_FAILED]: ProgressStatus.FAILED,
      [StakingDashboardStatus.STAKE_TX_CONFIRMED]: ProgressStatus.COMPLETED,
    }
    const showFees = [
      StakingDashboardStatus.APPROVAL_TX_COMPLETED,
      StakingDashboardStatus.STAKE_TX_PENDING,
      StakingDashboardStatus.STAKE_TX_FAILED,
    ].includes(stakingStatus)

    return {
      description: (
        <ChainLabel
          active={stakingStatus === StakingDashboardStatus.STAKE_TX_PENDING}
          chainId={hemi.id}
          label={t('stake-token', { symbol: token.symbol })}
        />
      ),
      explorerChainId: token.chainId,
      fees: getStepFees({
        fee: createLockGasFees,
        isError: isCreateLockFeesError,
        show: showFees,
      }),
      status: statusMap[stakingStatus] ?? ProgressStatus.NOT_READY,
      txHash: stakingDashboardOperation?.transactionHash,
    }
  }

  const getSteps = function () {
    const steps: StepPropsWithoutPosition[] = []
    if (needsApproval || stakingDashboardOperation?.approvalTxHash) {
      steps.push(addApprovalStep())
    }
    steps.push(addStakingStep())
    return steps
  }

  const getCallToAction = (status: StakingDashboardStatusType) =>
    [
      StakingDashboardStatus.APPROVAL_TX_FAILED,
      StakingDashboardStatus.STAKE_TX_FAILED,
    ].includes(status) ? (
      <RetryStake />
    ) : null

  return (
    <Operation
      amount={amount.toString()}
      callToAction={getCallToAction(stakingStatus)}
      heading={t('stake.heading')}
      onClose={onClose}
      steps={getSteps()}
      subheading={t('stake.subheading')}
      token={token}
    />
  )
}
