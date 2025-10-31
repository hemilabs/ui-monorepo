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
import {
  CollectAllRewardsDashboardStatus,
  CollectAllRewardsDashboardStatusType,
} from 'types/stakingDashboard'
import { getNativeToken } from 'utils/nativeToken'
import { formatUnits } from 'viem'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { useEstimateCollectAllRewardsFees } from '../../_hooks/useEstimateCollectAllRewards'
import { Operation } from '../operation'

import { RetryCollectRewards } from './retryCollectRewards'

type Props = {
  onClose: VoidFunction
}

export const ReviewCollectRewards = function ({ onClose }: Props) {
  const { collectRewardsDashboardOperation } = useStakingDashboard()
  const token = useHemiToken()

  // collectRewardsDashboardOperation is defined because this component is only rendered in that case
  const { stakingPosition, status, transactionHash } =
    collectRewardsDashboardOperation!

  const collectStatus =
    status ?? CollectAllRewardsDashboardStatus.COLLECT_TX_PENDING

  const t = useTranslations('staking-dashboard')
  const hemi = useHemi()

  const { fees: collectGasFees, isError: isCollectGasFeesError } =
    useEstimateCollectAllRewardsFees({
      chainId: hemi.id,
      tokenId: BigInt(stakingPosition!.tokenId),
    })

  const getStepFees = ({
    fee,
    isError,
    show,
  }: {
    fee: bigint
    isError: boolean
    show: boolean
  }): StepPropsWithoutPosition['fees'] =>
    show
      ? {
          amount: formatUnits(fee, hemi.nativeCurrency.decimals),
          isError,
          token: getNativeToken(hemi.id),
        }
      : undefined

  const addCollectRewardsStep = function (): StepPropsWithoutPosition {
    const statusMap: Record<
      CollectAllRewardsDashboardStatusType,
      ProgressStatusType
    > = {
      [CollectAllRewardsDashboardStatus.COLLECT_TX_PENDING]:
        ProgressStatus.PROGRESS,
      [CollectAllRewardsDashboardStatus.COLLECT_TX_FAILED]:
        ProgressStatus.FAILED,
      [CollectAllRewardsDashboardStatus.COLLECT_TX_CONFIRMED]:
        ProgressStatus.COMPLETED,
    }

    const showFees =
      collectStatus === CollectAllRewardsDashboardStatus.COLLECT_TX_PENDING ||
      collectStatus === CollectAllRewardsDashboardStatus.COLLECT_TX_FAILED

    return {
      description: (
        <ChainLabel
          active={
            collectStatus ===
            CollectAllRewardsDashboardStatus.COLLECT_TX_PENDING
          }
          chainId={hemi.id}
          label={t('drawer.claim-rewards', { network: hemi.name })}
        />
      ),
      explorerChainId: token.chainId,
      fees: getStepFees({
        fee: collectGasFees,
        isError: isCollectGasFeesError,
        show: showFees,
      }),
      status: statusMap[collectStatus] ?? ProgressStatus.NOT_READY,
      txHash: transactionHash,
    }
  }

  const getSteps = () => [addCollectRewardsStep()]

  return (
    <Operation
      amount={stakingPosition!.amount.toString()}
      callToAction={
        collectStatus ===
          CollectAllRewardsDashboardStatus.COLLECT_TX_FAILED && (
          <RetryCollectRewards />
        )
      }
      heading={t('claim-rewards.heading')}
      onClose={onClose}
      steps={getSteps()}
      subheading={t('claim-rewards.subheading')}
      token={token}
    />
  )
}
