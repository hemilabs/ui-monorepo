'use client'

import { ChainLabel } from 'components/reviewOperation/chainLabel'
import { Operation } from 'components/reviewOperation/operation'
import {
  ProgressStatus,
  ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { useHemi } from 'hooks/useHemi'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTranslations } from 'next-intl'
import { UnstakingDashboardStatus } from 'types/stakingDashboard'
import { getNativeToken } from 'utils/nativeToken'
import { formatUnits } from 'viem'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { useEstimateWithdrawFees } from '../../_hooks/useEstimateWithdraw'

import { RetryUnstake } from './retryUnstake'

type Props = {
  onClose: VoidFunction
}

export const ReviewUnstake = function ({ onClose }: Props) {
  const { unstakingDashboardOperation } = useStakingDashboard()
  const token = useHemiToken()

  // unstakingDashboardOperation is defined because this component is only rendered in that case
  const { stakingPosition, status } = unstakingDashboardOperation!

  const unStakingStatus =
    status ?? UnstakingDashboardStatus.UNSTAKE_TX_CONFIRMED

  const t = useTranslations('staking-dashboard.drawer')
  const hemi = useHemi()

  const { fees: withdrawGasFees, isError: isWithdrawGasFeesError } =
    useEstimateWithdrawFees({
      token,
      tokenId: BigInt(stakingPosition!.tokenId),
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

  const addUnstakingStep = function (): StepPropsWithoutPosition {
    const statusMap: Record<UnstakingDashboardStatus, ProgressStatusType> = {
      [UnstakingDashboardStatus.UNSTAKE_TX_PENDING]: ProgressStatus.PROGRESS,
      [UnstakingDashboardStatus.UNSTAKE_TX_FAILED]: ProgressStatus.FAILED,
      [UnstakingDashboardStatus.UNSTAKE_TX_CONFIRMED]: ProgressStatus.COMPLETED,
    }
    const showFees = [
      UnstakingDashboardStatus.UNSTAKE_TX_PENDING,
      UnstakingDashboardStatus.UNSTAKE_TX_FAILED,
    ].includes(unStakingStatus)

    return {
      description: (
        <ChainLabel
          active={
            unStakingStatus === UnstakingDashboardStatus.UNSTAKE_TX_PENDING
          }
          chainId={hemi.id}
          label={t('unstake-token', { symbol: token.symbol })}
        />
      ),
      explorerChainId: token.chainId,
      fees: getStepFees({
        fee: withdrawGasFees,
        isError: isWithdrawGasFeesError,
        show: showFees,
      }),
      status: statusMap[unStakingStatus] ?? ProgressStatus.NOT_READY,
      txHash: unstakingDashboardOperation?.transactionHash,
    }
  }

  const getSteps = function () {
    const steps: StepPropsWithoutPosition[] = []
    steps.push(addUnstakingStep())
    return steps
  }

  const getCallToAction = (callStatus: UnstakingDashboardStatus) =>
    [UnstakingDashboardStatus.UNSTAKE_TX_FAILED].includes(callStatus) ? (
      <RetryUnstake />
    ) : null

  return (
    <Operation
      amount={stakingPosition!.amount.toString()}
      callToAction={getCallToAction(unStakingStatus)}
      heading={t('unstake.heading')}
      onClose={onClose}
      steps={getSteps()}
      subheading={t('unstake.subheading')}
      token={token}
    />
  )
}
