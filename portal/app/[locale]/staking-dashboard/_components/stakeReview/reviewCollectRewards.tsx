import { ChainLabel } from 'components/reviewOperation/chainLabel'
import {
  ProgressStatus,
  ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { useHemi } from 'hooks/useHemi'
import { useHemiToken } from 'hooks/useHemiToken'
import {
  CollectAllRewardsDashboardStatus,
  CollectAllRewardsDashboardStatusType,
} from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'
import { getNativeToken } from 'utils/nativeToken'
import { getRewardsGeneration } from 'utils/veHemiEpochRewards'
import { formatUnits } from 'viem'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { useEstimateCollectAllRewardsFees } from '../../_hooks/useEstimateCollectAllRewards'
import { useRewardTokens } from '../../_hooks/useRewardTokens'
import { Operation } from '../operation'
import { RewardAmount } from '../rewardsDisplay'

import { RetryCollectRewards } from './retryCollectRewards'
import { ReviewClaimWalk } from './reviewClaimWalk'

type Props = {
  onClose: VoidFunction
}

// The review of a claim on the original rewards contract, which settles every asset for
// one position in a single transaction.
const ReviewCollectAllRewards = function ({ onClose }: Props) {
  const { collectRewardsDashboardOperation } = useStakingDashboard()
  const { tokens: rewardTokens } = useRewardTokens()
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
      // The claim ran to completion even though no transfer happened; the label below
      // is what says nothing was owed.
      [CollectAllRewardsDashboardStatus.COLLECT_NOTHING_OWED]:
        ProgressStatus.COMPLETED,
      [CollectAllRewardsDashboardStatus.COLLECT_PREPARING]:
        ProgressStatus.PROGRESS,
      [CollectAllRewardsDashboardStatus.COLLECT_REJECTED]:
        ProgressStatus.REJECTED,
    }

    const showFees =
      collectStatus === CollectAllRewardsDashboardStatus.COLLECT_TX_PENDING ||
      collectStatus === CollectAllRewardsDashboardStatus.COLLECT_REJECTED ||
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

  // The rewards being claimed, not the position's staked HEMI. This used to headline
  // `stakingPosition.amount`, so a claim of 115 reward tokens announced itself as
  // 40,000 HEMI - a bigger number, in a different asset, that nobody was receiving.
  const rewardsSlot = (
    <div className="flex flex-col gap-y-1">
      <span className="text-sm font-medium text-neutral-500">
        {t('claim-rewards.you-receive')}
      </span>
      {rewardTokens.map(rewardToken => (
        <RewardAmount
          className="text-neutral-950"
          key={rewardToken.address}
          token={rewardToken}
          tokenId={BigInt(stakingPosition!.tokenId)}
        />
      ))}
    </div>
  )

  return (
    <Operation
      amount={stakingPosition!.amount.toString()}
      amountSlot={rewardTokens.length > 0 ? rewardsSlot : undefined}
      callToAction={
        (collectStatus === CollectAllRewardsDashboardStatus.COLLECT_TX_FAILED ||
          collectStatus ===
            CollectAllRewardsDashboardStatus.COLLECT_REJECTED) && (
          <RetryCollectRewards />
        )
      }
      heading={t('claim-rewards.heading')}
      onClose={onClose}
      steps={[addCollectRewardsStep()]}
      subheading={t(
        collectStatus === CollectAllRewardsDashboardStatus.COLLECT_NOTHING_OWED
          ? 'claim-rewards.nothing-owed'
          : collectStatus === CollectAllRewardsDashboardStatus.COLLECT_REJECTED
            ? 'claim-rewards.declined'
            : 'claim-rewards.subheading',
      )}
      token={token}
    />
  )
}

// Two contracts with different claim shapes, so two reviews: the original settles one
// position in one transaction, the epoch one walks a range in chunks.
export const ReviewCollectRewards = function ({ onClose }: Props) {
  const hemi = useHemi()
  return getRewardsGeneration(hemi.id) === 'epoch' ? (
    <ReviewClaimWalk onClose={onClose} />
  ) : (
    <ReviewCollectAllRewards onClose={onClose} />
  )
}
