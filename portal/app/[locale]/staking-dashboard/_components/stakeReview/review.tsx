'use client'

import { useHemiToken } from 'app/[locale]/genesis-drop/_hooks/useHemiToken'
import { ChainLabel } from 'components/reviewOperation/chainLabel'
import { ProgressStatus } from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { useAllowance } from 'hooks/useAllowance'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import { StakingDashboardStatus } from 'types/stakingDashboard'
import { getNativeToken } from 'utils/nativeToken'
import { parseTokenUnits } from 'utils/token'
import { getVeHemiContractAddress } from 've-hemi-actions'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { useEstimateCreateLockFees } from '../../_hooks/useEstimateCreateLockFees'
import { daysToSeconds } from '../../_utils/lockCreationTimes'

import { Operation } from './operation'
import { RetryStake } from './retryStake'

type Props = {
  onClose: VoidFunction
}

export const Review = function ({ onClose }: Props) {
  const { input, lockupDays, stakingDashboardOperation } = useStakingDashboard()
  const token = useHemiToken()

  const stakingStatus =
    stakingDashboardOperation?.status ??
    StakingDashboardStatus.APPROVAL_TX_COMPLETED

  const t = useTranslations('staking-dashboard')
  const hemi = useHemi()
  const { address } = useAccount()

  const veHemiAddress = getVeHemiContractAddress(token.chainId)

  const amount = parseTokenUnits(input, token)

  const { data: allowance } = useAllowance(token.address, {
    args: {
      owner: address,
      spender: veHemiAddress,
    },
  })

  const requiresApproval = allowance < amount

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

  const addApprovalStep = function (): StepPropsWithoutPosition {
    const showFees = [
      StakingDashboardStatus.APPROVAL_TX_FAILED,
      StakingDashboardStatus.APPROVAL_TX_PENDING,
    ].includes(stakingStatus)

    const statusMap = {
      [StakingDashboardStatus.APPROVAL_TX_FAILED]: ProgressStatus.FAILED,
      [StakingDashboardStatus.APPROVAL_TX_PENDING]: ProgressStatus.PROGRESS,
    }

    return {
      description: (
        <ChainLabel
          active={stakingStatus === StakingDashboardStatus.APPROVAL_TX_PENDING}
          chainId={hemi.id}
          label={t('drawer.approving', { symbol: token.symbol })}
        />
      ),
      explorerChainId: token.chainId,
      fees: showFees
        ? {
            amount: formatUnits(
              approvalTokenGasFees,
              hemi.nativeCurrency.decimals,
            ),
            isError: isApprovalTokenGasFeesError,
            token: getNativeToken(hemi.id),
          }
        : undefined,
      status: statusMap[stakingStatus] ?? ProgressStatus.COMPLETED,
      txHash: stakingDashboardOperation?.approvalTxHash,
    }
  }

  const addStakingStep = function (): StepPropsWithoutPosition {
    const statusMap: Record<StakingDashboardStatus, ProgressStatus> = {
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
          label={t('drawer.stake-token', { symbol: token.symbol })}
        />
      ),
      explorerChainId: token.chainId,
      fees: showFees
        ? {
            amount: formatUnits(
              createLockGasFees,
              hemi.nativeCurrency.decimals,
            ),
            isError: isCreateLockFeesError,
            token: getNativeToken(hemi.id),
          }
        : undefined,
      status: statusMap[stakingStatus] ?? ProgressStatus.NOT_READY,
      txHash: stakingDashboardOperation?.transactionHash,
    }
  }

  const getSteps = function () {
    const steps: StepPropsWithoutPosition[] = []
    if (requiresApproval || stakingDashboardOperation?.approvalTxHash) {
      steps.push(addApprovalStep())
    }
    steps.push(addStakingStep())
    return steps
  }

  const getCallToAction = (status: StakingDashboardStatus) =>
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
      heading={t('drawer.heading')}
      onClose={onClose}
      steps={getSteps()}
      subheading={t('drawer.subheading')}
      token={token}
    />
  )
}
