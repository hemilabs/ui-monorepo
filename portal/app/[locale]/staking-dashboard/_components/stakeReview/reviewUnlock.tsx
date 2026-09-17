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
  UnlockingDashboardStatus,
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

export const ReviewUnlock = function ({ onClose }: Props) {
  const { unlockingDashboardOperation } = useStakingDashboard()
  const token = useHemiToken()

  // unlockingDashboardOperation is defined because this component is only rendered in that case
  const { requiresClassCapture, stakingPosition, status } =
    unlockingDashboardOperation!

  const unlockStatus = status ?? UnlockingDashboardStatus.UNLOCK_TX_CONFIRMED

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

  const addUnlockingStep = function (): StepPropsWithoutPosition {
    // Partial on purpose: while the class is captured the unlock hasn't started, so the
    // lookup below falls through to NOT_READY.
    const statusMap: Partial<
      Record<UnlockingDashboardStatusType, ProgressStatusType>
    > = {
      [UnlockingDashboardStatus.UNLOCK_TX_PENDING]: ProgressStatus.PROGRESS,
      [UnlockingDashboardStatus.UNLOCK_TX_FAILED]: ProgressStatus.FAILED,
      [UnlockingDashboardStatus.UNLOCK_TX_CONFIRMED]: ProgressStatus.COMPLETED,
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
      status: statusMap[unlockStatus] ?? ProgressStatus.NOT_READY,
      txHash: unlockingDashboardOperation?.transactionHash,
    }
  }

  // Recording the class is a separate transaction that has to be mined before the burn,
  // or the position can never be paid its unclaimed rewards. Only shown when the class
  // was not already on record.
  const addCaptureStep = function (): StepPropsWithoutPosition {
    const statusMap: Partial<
      Record<UnlockingDashboardStatusType, ProgressStatusType>
    > = {
      [UnlockingDashboardStatus.CAPTURE_TX_PENDING]: ProgressStatus.PROGRESS,
      [UnlockingDashboardStatus.CAPTURE_TX_FAILED]: ProgressStatus.FAILED,
    }

    return {
      description: (
        <ChainLabel
          active={unlockStatus === UnlockingDashboardStatus.CAPTURE_TX_PENDING}
          chainId={hemi.id}
          label={t('capture-position-class')}
        />
      ),
      explorerChainId: token.chainId,
      // The unlock step carries the fee summary; quoting this one too would imply the
      // two are comparable, and the burn is the expensive half.
      status: statusMap[unlockStatus] ?? ProgressStatus.COMPLETED,
      txHash:
        unlockStatus === UnlockingDashboardStatus.CAPTURE_TX_PENDING
          ? unlockingDashboardOperation?.transactionHash
          : undefined,
    }
  }

  const getSteps = () =>
    requiresClassCapture
      ? [addCaptureStep(), addUnlockingStep()]
      : [addUnlockingStep()]

  const getCallToAction = function (callStatus: UnlockingDashboardStatusType) {
    const map: Partial<Record<UnlockingDashboardStatusType, ReactNode>> = {
      // Retrying re-runs the whole withdraw action, which re-attempts the capture.
      [UnlockingDashboardStatus.CAPTURE_TX_FAILED]: <RetryUnlock />,
      [UnlockingDashboardStatus.UNLOCK_TX_FAILED]: <RetryUnlock />,
    }
    return map[callStatus]
  }

  return (
    <Operation
      amount={stakingPosition!.amount.toString()}
      callToAction={getCallToAction(unlockStatus)}
      heading={t('unlock.heading')}
      onClose={onClose}
      steps={getSteps()}
      subheading={t('unlock.subheading')}
      token={token}
    />
  )
}
