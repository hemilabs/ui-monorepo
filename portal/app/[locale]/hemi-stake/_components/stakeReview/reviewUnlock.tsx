import { ChainLabel } from 'components/reviewOperation/chainLabel'
import {
  ProgressStatus,
  ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { useHemi } from 'hooks/useHemi'
import { useHemiToken } from 'hooks/useHemiToken'
import { ReactNode } from 'react'
import {
  CaptureDashboardStatus,
  UnlockingDashboardStatus,
  type CaptureDashboardStatusType,
  type UnlockingDashboardStatusType,
} from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'
import { getNativeToken } from 'utils/nativeToken'
import { formatUnits } from 'viem'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { useEstimateWithdrawFees } from '../../_hooks/useEstimateWithdraw'
import { Operation } from '../operation'

import { RetryUnlock } from './retryUnlock'

type Props = {
  onClose: VoidFunction
}

const captureStatusMap: Record<CaptureDashboardStatusType, ProgressStatusType> =
  {
    [CaptureDashboardStatus.CAPTURE_TX_PENDING]: ProgressStatus.PROGRESS,
    [CaptureDashboardStatus.CAPTURE_TX_FAILED]: ProgressStatus.FAILED,
    [CaptureDashboardStatus.CAPTURE_TX_CONFIRMED]: ProgressStatus.COMPLETED,
  }

export const ReviewUnlock = function ({ onClose }: Props) {
  const { unlockingDashboardOperation } = useStakingDashboard()
  const token = useHemiToken()

  // unlockingDashboardOperation is defined because this component is only rendered in that case
  const { captureStatus, needsCapture, stakingPosition, status } =
    unlockingDashboardOperation!

  const unlockStatus = status

  const t = useTranslations('hemi-stake.drawer')
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

  const addCaptureStep = (): StepPropsWithoutPosition => ({
    description: (
      <ChainLabel
        active={captureStatus === CaptureDashboardStatus.CAPTURE_TX_PENDING}
        chainId={hemi.id}
        label={t('secure-rewards')}
      />
    ),
    explorerChainId: token.chainId,
    status:
      captureStatus === undefined
        ? ProgressStatus.NOT_READY
        : captureStatusMap[captureStatus],
    txHash: unlockingDashboardOperation?.captureTransactionHash,
  })

  const addUnlockingStep = function (): StepPropsWithoutPosition {
    const statusMap: Record<UnlockingDashboardStatusType, ProgressStatusType> =
      {
        [UnlockingDashboardStatus.UNLOCK_TX_PENDING]: ProgressStatus.PROGRESS,
        [UnlockingDashboardStatus.UNLOCK_TX_FAILED]: ProgressStatus.FAILED,
        [UnlockingDashboardStatus.UNLOCK_TX_CONFIRMED]:
          ProgressStatus.COMPLETED,
      }
    const showFees =
      unlockStatus === UnlockingDashboardStatus.UNLOCK_TX_PENDING ||
      unlockStatus === UnlockingDashboardStatus.UNLOCK_TX_FAILED

    return {
      description: (
        <ChainLabel
          active={unlockStatus === UnlockingDashboardStatus.UNLOCK_TX_PENDING}
          chainId={hemi.id}
          label={t('unlock-token', { symbol: token.symbol })}
        />
      ),
      explorerChainId: token.chainId,
      fees: getStepFees({
        fee: withdrawGasFees,
        isError: isWithdrawGasFeesError,
        show: showFees,
      }),
      status:
        unlockStatus === undefined
          ? ProgressStatus.NOT_READY
          : statusMap[unlockStatus],
      txHash: unlockingDashboardOperation?.transactionHash,
    }
  }

  const getSteps = () =>
    needsCapture ? [addCaptureStep(), addUnlockingStep()] : [addUnlockingStep()]

  const getCallToAction = function (callStatus: UnlockingDashboardStatusType) {
    const map: Partial<Record<UnlockingDashboardStatusType, ReactNode>> = {
      [UnlockingDashboardStatus.UNLOCK_TX_FAILED]: <RetryUnlock />,
    }
    return map[callStatus]
  }

  return (
    <Operation
      amount={stakingPosition!.amount.toString()}
      callToAction={
        unlockStatus === undefined ? undefined : getCallToAction(unlockStatus)
      }
      heading={t('unlock.heading')}
      onClose={onClose}
      steps={getSteps()}
      subheading={t('unlock.subheading')}
      token={token}
    />
  )
}
