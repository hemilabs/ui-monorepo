'use client'

import { ChainLabel } from 'components/reviewOperation/chainLabel'
import {
  ProgressStatus,
  ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { useHemi } from 'hooks/useHemi'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'
import {
  UnlockingDashboardStatus,
  type UnlockingDashboardStatusType,
} from 'types/stakingDashboard'
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
  const { stakingPosition, status } = unlockingDashboardOperation!

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
      status: statusMap[unlockStatus] ?? ProgressStatus.NOT_READY,
      txHash: unlockingDashboardOperation?.transactionHash,
    }
  }

  const getSteps = () => [addUnlockingStep()]

  const getCallToAction = function (callStatus: UnlockingDashboardStatusType) {
    const map: Partial<Record<UnlockingDashboardStatusType, ReactNode>> = {
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
