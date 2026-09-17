import { ChainLabel } from 'components/reviewOperation/chainLabel'
import {
  ProgressStatus,
  type ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { useHemi } from 'hooks/useHemi'
import { useHemiToken } from 'hooks/useHemiToken'
import { type FormEvent, useMemo } from 'react'
import {
  CollectAllRewardsDashboardStatus,
  type ClaimRewardTotal,
  type ClaimStepStatus,
  type ClaimWalkPosition,
  type CollectAllRewardsDashboardOperation,
} from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { useClaimEligibility } from '../../_hooks/useClaimEligibility'
import { useClaimRewardsWalkthrough } from '../../_hooks/useClaimRewardsWalkthrough'
import { ClaimTotal } from '../claimTotal'
import { Operation } from '../operation'

import { ClaimAssetsIndividually } from './claimAssetsIndividually'
import { RetryForm } from './retryForm'

// `waiting` and `signing` are both in flight - one on the holder, one on a block - and
// the step's label already says which.
const progressStatusOf: Record<ClaimStepStatus, ProgressStatusType> = {
  confirmed: ProgressStatus.COMPLETED,
  declined: ProgressStatus.REJECTED,
  failed: ProgressStatus.FAILED,
  signing: ProgressStatus.PROGRESS,
  waiting: ProgressStatus.PROGRESS,
}

// Which of the four a position with no transactions of its own is: owed nothing,
// stopped, being planned now, or still queued.
const unstartedLabel = function ({
  isNext,
  isRunning,
  position,
}: {
  isNext: boolean
  isRunning: boolean
  position: ClaimWalkPosition
}) {
  if (position.outcome === 'nothing-owed') {
    return 'nothing-owed'
  }
  if (position.outcome !== undefined) {
    return 'stopped'
  }
  if (isNext) {
    return 'preparing'
  }
  return isRunning ? 'queued' : 'stopped'
}

const unstartedStatus = function ({
  isNext,
  position,
}: {
  isNext: boolean
  position: ClaimWalkPosition
}): ProgressStatusType {
  const outcomeStatus: Record<string, ProgressStatusType> = {
    'declined': ProgressStatus.REJECTED,
    'failed': ProgressStatus.FAILED,
    'nothing-owed': ProgressStatus.COMPLETED,
    'paid': ProgressStatus.COMPLETED,
  }
  if (position.outcome !== undefined) {
    return outcomeStatus[position.outcome]
  }
  return isNext ? ProgressStatus.PROGRESS : ProgressStatus.NOT_READY
}

// Re-runs the positions of a walk that did not finish. Ones already paid are left out:
// asking again is safe, but it costs a plan, a simulation and a prompt to be told so.
const RetryWalk = function ({ walk }: { walk: ClaimWalkPosition[] }) {
  const t = useTranslations()
  const { collectRewardsDashboardOperation } = useStakingDashboard()
  const { totals } = collectRewardsDashboardOperation!

  // Settled positions are carried through as `settled` so the retry's drawer still
  // shows what they paid.
  const isSettled = (position: ClaimWalkPosition) =>
    position.outcome === 'paid' || position.outcome === 'nothing-owed'

  const settled = useMemo(() => walk.filter(isSettled), [walk])
  const targets = useMemo(
    () =>
      walk
        .filter(position => !isSettled(position))
        .map(({ amount, tokenId }) => ({ amount, tokenId })),
    [walk],
  )

  const { isPending, mutate } = useClaimRewardsWalkthrough({
    settled,
    targets,
    totals,
  })

  // The same rule the row menu applies: a claim that failed on a pause or an oversized
  // registry will fail the same way again. Ownership isn't part of it here.
  const { disabled, reason } = useClaimEligibility({
    owner: '',
    tokenId: targets[0]?.tokenId ?? BigInt(0),
  })

  // Nothing left to retry. Only reached if every position settled while the drawer was
  // still reporting a failure.
  if (targets.length === 0) {
    return null
  }

  const handleRetry = function (event: FormEvent) {
    event.preventDefault()
    mutate()
  }

  return (
    <RetryForm
      disabled={disabled}
      isCollecting={isPending}
      onRetry={handleRetry}
      reason={
        reason === undefined
          ? undefined
          : t(`staking-dashboard.claim-rewards.ineligible.${reason}`)
      }
    />
  )
}

// The positions a review has to draw. A claim reports its walk before it reads anything,
// so the fallback is only for an operation that names a position without starting one.
const walkOf = function ({
  stakingPosition,
  walk,
}: CollectAllRewardsDashboardOperation): ClaimWalkPosition[] {
  if (walk?.length) {
    return walk
  }
  return stakingPosition
    ? [
        {
          amount: stakingPosition.amount,
          steps: [],
          tokenId: stakingPosition.tokenId,
        },
      ]
    : []
}

// What is owed, as read before anything was signed. The live figures go to zero the
// moment the claim lands, which would head the confirmation "You receive 0".
const ClaimTotals = function ({
  totals,
}: {
  totals: readonly ClaimRewardTotal[] | undefined
}) {
  const t = useTranslations('staking-dashboard.claim-rewards')
  return (
    <div className="flex flex-col gap-y-1">
      <span className="text-sm font-medium text-neutral-500">
        {t('you-receive')}
      </span>
      {totals?.length ? (
        totals.map(total => <ClaimTotal key={total.token} total={total} />)
      ) : (
        <span className="text-sm font-medium text-neutral-950">-</span>
      )}
    </div>
  )
}

/**
 * The review of an epoch claim: every position in it, and every transaction in each.
 *
 * An epoch claim is bounded, so one position can take several signatures and a claim-all
 * is that again per position. Each step stays on screen with its own transaction rather
 * than being replaced by a "claim 2 of 3" counter.
 */
export const ReviewClaimWalk = function ({
  onClose,
}: {
  onClose: VoidFunction
}) {
  const { collectRewardsDashboardOperation } = useStakingDashboard()
  const t = useTranslations('staking-dashboard')
  const hemi = useHemi()
  const token = useHemiToken()

  // Defined because this component is only rendered in that case.
  const { status, totals } = collectRewardsDashboardOperation!
  const walk = walkOf(collectRewardsDashboardOperation!)
  const collectStatus =
    status ?? CollectAllRewardsDashboardStatus.COLLECT_PREPARING

  const isRunning =
    collectStatus === CollectAllRewardsDashboardStatus.COLLECT_PREPARING ||
    collectStatus === CollectAllRewardsDashboardStatus.COLLECT_TX_PENDING

  const positionSteps = function (
    position: ClaimWalkPosition,
    isNext: boolean,
  ): StepPropsWithoutPosition[] {
    const tokenId = position.tokenId.toString()

    if (position.steps.length === 0) {
      // No transaction was planned for this position, and why decides what to say. A
      // walk that stopped leaves the positions it never reached unclaimed, not waiting -
      // "waiting its turn" would promise a turn that is never coming.
      const label = unstartedLabel({ isNext, isRunning, position })
      return [
        {
          description: (
            <ChainLabel
              active={isNext}
              chainId={hemi.id}
              label={t(`claim-rewards.walk.${label}`, { tokenId })}
            />
          ),
          status: unstartedStatus({ isNext, position }),
        },
      ]
    }

    return position.steps.map(step => ({
      description: (
        <div className="flex flex-col">
          <ChainLabel
            active={step.status === 'signing' || step.status === 'waiting'}
            chainId={hemi.id}
            label={t(
              step.chunks > 1
                ? 'claim-rewards.walk.position-transaction'
                : 'claim-rewards.walk.position-claim',
              { chunk: step.chunk, chunks: step.chunks, tokenId },
            )}
          />
          {/* The epochs this signature settles - otherwise two transactions for the
              same position look like one asked for twice. */}
          <span className="text-xs font-medium text-neutral-500">
            {t('claim-rewards.walk.epochs', { from: step.from, to: step.to })}
          </span>
        </div>
      ),
      explorerChainId: hemi.id,
      status: progressStatusOf[step.status],
      txHash: step.transactionHash,
    }))
  }

  // The position being worked on now. A walk runs one at a time, so at most one step
  // may show as in progress.
  const nextTokenId = walk.find(
    position => position.outcome === undefined,
  )?.tokenId

  const steps = walk.flatMap((position, index) =>
    positionSteps(position, position.tokenId === nextTokenId && isRunning).map(
      (step, stepIndex) => ({
        ...step,
        // Only between positions, so one position's transactions read as one thing.
        separator: index > 0 && stepIndex === 0,
      }),
    ),
  )

  const isSinglePosition = walk.length === 1
  const canRetry =
    collectStatus === CollectAllRewardsDashboardStatus.COLLECT_TX_FAILED ||
    collectStatus === CollectAllRewardsDashboardStatus.COLLECT_REJECTED

  const getSubheading = function () {
    if (
      collectStatus === CollectAllRewardsDashboardStatus.COLLECT_NOTHING_OWED
    ) {
      return 'claim-rewards.nothing-owed'
    }
    if (collectStatus === CollectAllRewardsDashboardStatus.COLLECT_REJECTED) {
      return 'claim-rewards.declined'
    }
    if (
      collectStatus === CollectAllRewardsDashboardStatus.COLLECT_TX_CONFIRMED
    ) {
      return 'claim-rewards.walk.done'
    }
    return isSinglePosition
      ? 'claim-rewards.subheading'
      : 'claim-rewards.walk.subheading'
  }

  return (
    <Operation
      amountSlot={<ClaimTotals totals={totals} />}
      callToAction={
        canRetry && (
          <div className="flex w-full flex-col gap-y-3">
            <RetryWalk walk={walk} />
            {/* Only after a failure, and only for one position - the pre-flight behind
                this costs a simulation per registered asset. */}
            {isSinglePosition && (
              <ClaimAssetsIndividually tokenId={walk[0].tokenId} />
            )}
          </div>
        )
      }
      heading={t(
        isSinglePosition
          ? 'claim-rewards.heading'
          : 'claim-rewards.walk.heading',
      )}
      onClose={onClose}
      steps={steps}
      subheading={t(getSubheading())}
      token={token}
    />
  )
}
