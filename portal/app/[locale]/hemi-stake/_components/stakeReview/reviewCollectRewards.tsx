import { DisplayAmount } from 'components/displayAmount'
import { ChainLabel } from 'components/reviewOperation/chainLabel'
import {
  ProgressStatus,
  ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { TokenLogo } from 'components/tokenLogo'
import { useHemi } from 'hooks/useHemi'
import { useHemiToken } from 'hooks/useHemiToken'
import {
  CollectAllRewardsDashboardStatus,
  CollectAllRewardsDashboardStatusType,
  type ClaimableReward,
  type CollectAllRewardsStep,
} from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'
import { getNativeToken } from 'utils/nativeToken'
import { formatUnits, isAddress, isAddressEqual } from 'viem'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { useEstimateCollectAllRewardsFees } from '../../_hooks/useEstimateCollectAllRewards'
import { useRewardTokens } from '../../_hooks/useRewardTokens'
import { Operation } from '../operation'

import { RetryCollectRewards } from './retryCollectRewards'

type Props = {
  onClose: VoidFunction
}

const statusMap: Record<
  CollectAllRewardsDashboardStatusType,
  ProgressStatusType
> = {
  [CollectAllRewardsDashboardStatus.COLLECT_TX_PENDING]:
    ProgressStatus.PROGRESS,
  [CollectAllRewardsDashboardStatus.COLLECT_TX_FAILED]: ProgressStatus.FAILED,
  [CollectAllRewardsDashboardStatus.COLLECT_TX_CONFIRMED]:
    ProgressStatus.COMPLETED,
}

const RewardsToClaim = function ({ rewards }: { rewards: ClaimableReward[] }) {
  const t = useTranslations('hemi-stake.table')
  const { tokens } = useRewardTokens()

  const claimable = rewards.filter(({ amount }) => amount > BigInt(0))

  if (claimable.length === 0) {
    return null
  }

  return (
    <div className="flex items-start justify-between text-sm font-medium">
      <span className="text-neutral-500">{t('rewards')}</span>
      <div className="flex flex-col items-end gap-y-1 text-neutral-950">
        {claimable.map(function (reward) {
          const token = tokens.find(
            candidate =>
              isAddress(candidate.address) &&
              isAddressEqual(candidate.address, reward.token),
          )
          return token ? (
            <div className="flex items-center gap-x-1" key={reward.token}>
              <TokenLogo size="xSmall" token={token} />
              <DisplayAmount
                amount={formatUnits(reward.amount, reward.decimals)}
                token={token}
              />
            </div>
          ) : null
        })}
      </div>
    </div>
  )
}

export const ReviewCollectRewards = function ({ onClose }: Props) {
  const { collectRewardsDashboardOperation } = useStakingDashboard()
  const token = useHemiToken()

  // collectRewardsDashboardOperation is defined because this component is only rendered in that case
  const { rewards = [], status, steps = [] } = collectRewardsDashboardOperation!

  const t = useTranslations('hemi-stake')
  const hemi = useHemi()

  const nextStep = steps.find(
    step =>
      step.status !== CollectAllRewardsDashboardStatus.COLLECT_TX_CONFIRMED,
  )

  const { fees: collectGasFees, isError: isCollectGasFeesError } =
    useEstimateCollectAllRewardsFees({
      chainId: hemi.id,
      fromEpoch: nextStep?.fromEpoch,
      toEpoch: nextStep?.toEpoch,
      tokenId: nextStep?.tokenId,
    })

  const positionCount = new Set(steps.map(({ tokenId }) => tokenId)).size

  const getStepLabel = function (step: CollectAllRewardsStep) {
    const positionSteps = steps.filter(
      ({ tokenId }) => tokenId === step.tokenId,
    )
    const values = {
      fromEpoch: step.fromEpoch.toString(),
      step: positionSteps.indexOf(step) + 1,
      toEpoch: step.toEpoch.toString(),
      tokenId: step.tokenId.toString(),
      total: positionSteps.length,
    }
    if (positionCount > 1) {
      return positionSteps.length > 1
        ? t('drawer.claim-position-rewards-step', values)
        : t('drawer.claim-position-rewards', values)
    }
    return positionSteps.length > 1
      ? t('drawer.claim-rewards-step', values)
      : t('drawer.claim-rewards', values)
  }

  const addCollectRewardsStep = function (
    step: CollectAllRewardsStep,
  ): StepPropsWithoutPosition {
    const stepStatus = step.status
    const isNext = step === nextStep
    const showFees =
      isNext &&
      stepStatus !== CollectAllRewardsDashboardStatus.COLLECT_TX_CONFIRMED

    return {
      description: (
        <ChainLabel
          active={
            stepStatus === CollectAllRewardsDashboardStatus.COLLECT_TX_PENDING
          }
          chainId={hemi.id}
          label={getStepLabel(step)}
        />
      ),
      explorerChainId: token.chainId,
      fees: showFees
        ? {
            amount: formatUnits(collectGasFees, hemi.nativeCurrency.decimals),
            isError: isCollectGasFeesError,
            token: getNativeToken(hemi.id),
          }
        : undefined,
      status:
        stepStatus === undefined
          ? ProgressStatus.NOT_READY
          : statusMap[stepStatus],
      txHash: step.transactionHash,
    }
  }

  return (
    <Operation
      amountSection={<RewardsToClaim rewards={rewards} />}
      callToAction={
        status === CollectAllRewardsDashboardStatus.COLLECT_TX_FAILED && (
          <RetryCollectRewards />
        )
      }
      heading={t('claim-rewards.heading')}
      onClose={onClose}
      steps={steps.map(addCollectRewardsStep)}
      subheading={t('claim-rewards.subheading')}
      token={token}
    />
  )
}
