import { Button } from 'components/button'
import { useHemi } from 'hooks/useHemi'
import { useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import type { ClaimRewardTotal, StakingPosition } from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'
import { getRewardsGeneration } from 'utils/veHemiEpochRewards'
import { useAccount } from 'wagmi'

import { useAllPositionsClaimable } from '../_hooks/useAllPositionsClaimable'
import { useClaimedHistory } from '../_hooks/useClaimedHistory'
import {
  useClaimRewardsWalkthrough,
  useIsClaimingEpochRewards,
} from '../_hooks/useClaimRewardsWalkthrough'
import { useEpochSystemState } from '../_hooks/useEpochSystemState'
import { useRewardTokens } from '../_hooks/useRewardTokens'
import { claimedTotals } from '../_utils/claimedTotals'
import { claimIneligibility } from '../_utils/claimEligibility'

import { ClaimTotal } from './claimTotal'

// The summed figure, or a reason there isn't one. `combineClaimable` still returns what
// landed when a read fails, and a sum missing one position's money is not a total - the
// reason for the gap appears beside the button.
const Total = function ({
  isPending,
  isUnavailable,
  totals,
}: {
  isPending: boolean
  isUnavailable: boolean
  totals: readonly ClaimRewardTotal[]
}) {
  if (isPending) {
    return <Skeleton className="h-5 w-32" />
  }
  if (isUnavailable || totals.length === 0) {
    return <span className="text-sm font-medium text-neutral-950">-</span>
  }
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {totals.map(total => (
        <ClaimTotal key={total.token} total={total} />
      ))}
    </div>
  )
}

/**
 * Everything the wallet is owed, across every position, and one control to collect it.
 *
 * Positions are claimed one after another: the contract takes a single position per call
 * and requires the caller to be the holder it names, so nothing can batch them. The
 * drawer walks through each signature as it is asked for, which is what makes a run of
 * identical prompts followable.
 *
 * Positions owing nothing are left out - each one still costs a plan, a simulation and a
 * prompt to transfer nothing.
 */
export const ClaimAllRewards = function ({
  positions,
}: {
  positions: StakingPosition[] | undefined
}) {
  const t = useTranslations('staking-dashboard')
  const { address, chainId: connectedChainId } = useAccount()
  const hemi = useHemi()
  const { data: systemState } = useEpochSystemState()
  const { claimableTokenIds, isPending, isUnavailable, totals } =
    useAllPositionsClaimable(positions)
  const { tokens: rewardTokens } = useRewardTokens()
  const { data: history } = useClaimedHistory()
  const claimed = claimedTotals({ assets: rewardTokens, rows: history })
  // Any claim, not only this one - the wallet can be asked one thing at a time.
  const isClaiming = useIsClaimingEpochRewards()

  const targets = useMemo(
    () =>
      positions
        ?.filter(position => claimableTokenIds.includes(position.tokenId))
        .map(({ amount, owner, tokenId }) => ({ amount, owner, tokenId })) ??
      [],
    [claimableTokenIds, positions],
  )

  const { mutate } = useClaimRewardsWalkthrough({ targets, totals })

  const reason = claimIneligibility({
    address,
    connectedChainId,
    generation: 'epoch',
    // Not collapsed into `false` while the reads are landing or have failed - either
    // would claim nothing is owed on the strength of a read that never happened.
    hasRewards: isPending || isUnavailable ? undefined : totals.length > 0,
    hemiChainId: hemi.id,
    isRewardsUnavailable: isUnavailable,
    // Ignored on this generation, which pays whoever held the position.
    owner: '',
    systemState,
  })

  // Nothing to total. The row menu still offers a claim per position.
  if (getRewardsGeneration(hemi.id) !== 'epoch' || !positions?.length) {
    return null
  }

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-solid border-neutral-300/55 bg-white p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
        <div className="flex flex-col gap-y-1">
          <span className="text-sm font-medium text-neutral-500">
            {t('claim-all.heading')}
          </span>
          <Total
            isPending={isPending}
            isUnavailable={isUnavailable}
            totals={totals}
          />
          {/* Positions the claim would visit, not positions owned - the button's cost in
              wallet prompts, before it is pressed. */}
          {targets.length > 0 && !isUnavailable && (
            <span className="body-text-caption text-neutral-500">
              {t('claim-all.positions', { count: targets.length })}
            </span>
          )}
        </div>
        {/* Only once something has been paid. A history of nothing is said better by
            not being there than by a column of zeros. */}
        {claimed.length > 0 && (
          <div className="flex flex-col gap-y-1">
            <span className="text-sm font-medium text-neutral-500">
              {t('claim-all.claimed')}
            </span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {claimed.map(total => (
                <ClaimTotal key={total.token} total={total} />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col items-start gap-y-1 md:items-end">
        <Button
          disabled={isClaiming || reason !== undefined}
          onClick={() => mutate()}
          size="small"
          type="button"
        >
          {t('claim-all.button')}
        </Button>
        {/* In the open, not in a tooltip: a disabled control doesn't reliably hover. */}
        {reason !== undefined && (
          <span className="body-text-caption text-neutral-500">
            {t(`claim-rewards.ineligible.${reason}`)}
          </span>
        )}
      </div>
    </div>
  )
}
