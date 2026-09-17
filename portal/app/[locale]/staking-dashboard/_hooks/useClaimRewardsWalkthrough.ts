import { useEnsureConnectedTo } from '@hemilabs/react-hooks/useEnsureConnectedTo'
import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import type { EventEmitter } from 'events'
import { getTokenBalanceQueryKey } from 'hooks/useBalance'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient, useHemiWalletClient } from 'hooks/useHemiClient'
import { useRef } from 'react'
import {
  CollectAllRewardsDashboardStatus,
  type ClaimPositionOutcome,
  type ClaimRewardTotal,
  type ClaimStepStatus,
  type ClaimWalkPosition,
  type CollectAllRewardsDashboardStatusType,
} from 'types/stakingDashboard'
import {
  getEpochRewardsAddress,
  getEpochRewardsLensAddress,
} from 'utils/veHemiEpochRewards'
import type {
  ClaimEpochRewardsEvents,
  ClaimEpochRewardsProgress,
} from 've-hemi-rewards'
import { claimEpochRewards } from 've-hemi-rewards/actions'
import type { Hash } from 'viem'
import { useAccount } from 'wagmi'

import { useStakingDashboard } from '../_context/stakingDashboardContext'
import {
  finishPosition,
  recordStep,
  startPosition,
  walkOutcome,
} from '../_utils/claimWalk'

import { getClaimedHistoryQueryKeyPrefix } from './useClaimedHistory'
import { useDrawerStakingQueryString } from './useDrawerStakingQueryString'
import { getEpochClaimableByTokenQueryKeyPrefix } from './useEpochClaimableByToken'
import { useEpochSystemState } from './useEpochSystemState'

export type ClaimTarget = {
  amount: bigint
  // Only used to name the position when a single one is being reviewed. A retry rebuilt
  // from the walk has no owner to hand, and needs none - epoch claims are not gated on
  // who owns the position now.
  owner?: string
  tokenId: bigint
}

// Prefix-matched, so asking about one position also matches a walk containing it. The
// row menu, the drawer's retry and claim-all all read the same in-flight state.
const claimEpochRewardsMutationKey = ['claimEpochRewards']

const getClaimEpochRewardsMutationKey = (tokenIds: readonly bigint[]) => [
  ...claimEpochRewardsMutationKey,
  ...tokenIds.map(tokenId => tokenId.toString()),
]

// Whether any epoch claim is in flight. Every entry point disables on this rather than
// on its own claim: the wallet can only be asked one thing at a time.
export const useIsClaimingEpochRewards = () =>
  useIsMutating({ mutationKey: claimEpochRewardsMutationKey }) > 0

// Closes a position off and says how it ended. The action reports every outcome through
// the emitter and always fulfils, so reaching no terminal event means it finished.
const settle = function (
  walkRef: { current: ClaimWalkPosition[] },
  tokenId: bigint,
) {
  const walked = walkRef.current.find(position => position.tokenId === tokenId)
  if (walked?.outcome === undefined) {
    walkRef.current = finishPosition(walkRef.current, {
      outcome: walked?.steps.length ? 'paid' : 'nothing-owed',
      tokenId,
    })
  }
  return walkRef.current.find(position => position.tokenId === tokenId)?.outcome
}

// Wires one position's claim into the walk. Module level, and handed the ref, so the
// event vocabulary lives in one place instead of once per position inside the loop.
const trackClaim = function ({
  emitter,
  publish,
  tokenId,
  walkRef,
}: {
  emitter: EventEmitter<ClaimEpochRewardsEvents>
  publish: (update: {
    status: CollectAllRewardsDashboardStatusType
    transactionHash?: Hash
  }) => void
  tokenId: bigint
  walkRef: { current: ClaimWalkPosition[] }
}) {
  const close = function (outcome: ClaimPositionOutcome) {
    walkRef.current = finishPosition(walkRef.current, { outcome, tokenId })
  }
  const step = function (
    status: ClaimStepStatus,
    progress: ClaimEpochRewardsProgress,
    transactionHash?: Hash,
  ) {
    walkRef.current = recordStep(walkRef.current, {
      progress,
      status,
      tokenId,
      transactionHash,
    })
  }

  // Announced per chunk before it is signed, so a failure while preparing chunk k+1 is
  // not reported against chunk k, which has already confirmed.
  emitter.on('pre-claim-epoch-chunk', function (progress) {
    step('waiting', progress)
    publish({ status: CollectAllRewardsDashboardStatus.COLLECT_TX_PENDING })
  })
  emitter.on(
    'user-signed-claim-epoch-chunk',
    function (transactionHash, progress) {
      step('signing', progress, transactionHash)
      publish({ status: CollectAllRewardsDashboardStatus.COLLECT_TX_PENDING })
    },
  )
  emitter.on('claim-epoch-chunk-succeeded', function (receipt, progress) {
    step('confirmed', progress, receipt.transactionHash)
    // The success toast links to the operation's hash, so keep the latest one.
    publish({
      status: CollectAllRewardsDashboardStatus.COLLECT_TX_PENDING,
      transactionHash: receipt.transactionHash,
    })
  })
  emitter.on('claim-epoch-chunk-reverted', function (receipt, progress) {
    step('failed', progress, receipt.transactionHash)
    close('failed')
  })
  // Resolved, owing nothing. The planner found no payable chunk, so nothing was sent.
  emitter.on('nothing-to-claim', () => close('nothing-owed'))
  // A declined prompt is a choice, not a fault.
  emitter.on('user-signing-claim-epoch-rewards-error', () => close('declined'))
  emitter.on('claim-epoch-rewards-failed', () => close('failed'))
  // A validation failure (paused, wrong chain, account switch) can land before anything
  // is signed, and an unexpected throw at any point. Neither may leave a step spinning.
  emitter.on('claim-epoch-rewards-failed-validation', () => close('failed'))
  emitter.on('unexpected-error', () => close('failed'))
}

/**
 * Claims one position or every position, walking the drawer through each step.
 *
 * Positions go one after another, each with its own wallet prompts. Batching is not
 * possible: `claim` takes a single position and requires the caller to be the holder it
 * names, which rules out an aggregator (W9 in the follow-on plan covers the EIP-5792
 * route and why it was parked). This doesn't remove the prompts, it just shows what each
 * one is for.
 *
 * A single claim is a walk of length one, so the two paths can't drift.
 */
export const useClaimRewardsWalkthrough = function ({
  settled = [],
  targets,
  totals,
}: {
  // Positions an earlier attempt finished. A retry replans only what is left, and these
  // keep the record of what was already paid on screen.
  settled?: readonly ClaimWalkPosition[]
  targets: readonly ClaimTarget[]
  // What is owed, read before anything is claimed. The live figures go to zero once the
  // claim lands, which would head the confirmation "You receive 0".
  totals: readonly ClaimRewardTotal[] | undefined
}) {
  const { address } = useAccount()
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()
  const { hemiWalletClient } = useHemiWalletClient()
  const ensureConnectedTo = useEnsureConnectedTo()
  const queryClient = useQueryClient()
  const { data: systemState } = useEpochSystemState()
  const { queryKey: nativeTokenBalanceQueryKey } = useNativeBalance(chainId)
  const { updateCollectRewardsDashboardOperation } = useStakingDashboard()
  const { setDrawerQueryString } = useDrawerStakingQueryString()

  const lensAddress = getEpochRewardsLensAddress(chainId)
  const rewardsAddress = getEpochRewardsAddress(chainId)

  // A ref, not state: each emitter callback needs the walk as it stands now, and a state
  // value from the registering render would make every step overwrite the last.
  const walkRef = useRef<ClaimWalkPosition[]>([])

  const mutation = useMutation({
    mutationFn: async function runClaimWalkthrough() {
      if (!address) {
        throw new Error('No account connected')
      }
      if (!lensAddress || !rewardsAddress || !systemState) {
        throw new Error('Epoch rewards are not configured for this chain')
      }

      const publish = function ({
        status,
        transactionHash,
      }: {
        status: CollectAllRewardsDashboardStatusType
        transactionHash?: Hash
      }) {
        updateCollectRewardsDashboardOperation({
          status,
          ...(transactionHash === undefined ? {} : { transactionHash }),
          walk: [...walkRef.current],
        })
      }

      await ensureConnectedTo(chainId)

      for (const { tokenId } of targets) {
        const { emitter, promise } = claimEpochRewards({
          chainId,
          fromEpoch: systemState.firstFundableEpoch,
          holder: address,
          lensAddress,
          publicClient: hemiClient,
          rewardsAddress,
          toEpoch: systemState.settledEpoch,
          tokenId,
          walletClient: hemiWalletClient!,
        })

        trackClaim({ emitter, publish, tokenId, walkRef })

        await promise

        const outcome = settle(walkRef, tokenId)
        publish({ status: CollectAllRewardsDashboardStatus.COLLECT_TX_PENDING })

        // Safe to stop: claims are idempotent, so anything unsigned can be asked for
        // again. Carrying on would keep prompting someone who just declined.
        if (outcome === 'declined' || outcome === 'failed') {
          break
        }
      }

      // One mapping from outcome to status, so declined and failed stay distinct.
      const outcomeStatus = {
        'declined': CollectAllRewardsDashboardStatus.COLLECT_REJECTED,
        'failed': CollectAllRewardsDashboardStatus.COLLECT_TX_FAILED,
        'nothing-owed': CollectAllRewardsDashboardStatus.COLLECT_NOTHING_OWED,
        'paid': CollectAllRewardsDashboardStatus.COLLECT_TX_CONFIRMED,
      } as const
      publish({ status: outcomeStatus[walkOutcome(walkRef.current)] })
      // Reopened rather than assumed open - the drawer can be dismissed mid-walk.
      setDrawerQueryString('claimingRewards')
    },
    mutationKey: getClaimEpochRewardsMutationKey(
      targets.map(target => target.tokenId),
    ),
    onSettled() {
      // Re-read rather than writing an optimistic zero. A walk that stopped part-way
      // collected for some positions and not others, and only the chain knows which.
      targets.forEach(({ tokenId }) =>
        queryClient.invalidateQueries({
          queryKey: getEpochClaimableByTokenQueryKeyPrefix({
            chainId,
            tokenId,
          }),
        }),
      )

      // Whatever settled is now history rather than claimable.
      queryClient.invalidateQueries({
        queryKey: getClaimedHistoryQueryKeyPrefix({ chainId, holder: address }),
      })

      // Every chunk cost gas, whether or not the walk finished.
      queryClient.invalidateQueries({ queryKey: nativeTokenBalanceQueryKey })

      systemState?.tokens.forEach(function (tokenAddress) {
        if (address) {
          queryClient.invalidateQueries({
            queryKey: getTokenBalanceQueryKey({
              account: address,
              chainId,
              tokenAddress,
            }),
          })
        }
      })
    },
  })

  // Reported at click, not at the first emitter event: the action spends several seconds
  // of reads planning before it can emit anything. Wrapping `mutate` covers every entry
  // point without any of them knowing about it.
  const claim = function () {
    walkRef.current = targets.reduce(
      (walk, { amount, tokenId }) => startPosition(walk, { amount, tokenId }),
      // A retried position is replanned from scratch, so its old chunk numbering
      // describes a claim that no longer exists. Don't seed it.
      settled.filter(
        position =>
          !targets.some(target => target.tokenId === position.tokenId),
      ),
    )
    updateCollectRewardsDashboardOperation({
      // Only for a single position. Naming the first of several would put every
      // position's progress under that one's amount.
      stakingPosition:
        targets.length === 1 && targets[0].owner !== undefined
          ? { ...targets[0], owner: targets[0].owner }
          : undefined,
      status: CollectAllRewardsDashboardStatus.COLLECT_PREPARING,
      totals,
      // Cleared explicitly: the reducer merges into the previous operation, so the last
      // claim's hash would otherwise show against this one.
      transactionHash: undefined,
      walk: walkRef.current,
    })
    setDrawerQueryString('claimingRewards')
    mutation.mutate(undefined, {
      // The mutation can reject before the action exists and before any event can fire
      // (a declined chain switch, no account), leaving the preparing step spinning.
      onError() {
        updateCollectRewardsDashboardOperation({
          status: CollectAllRewardsDashboardStatus.COLLECT_TX_FAILED,
        })
      },
    })
  }

  return { ...mutation, mutate: claim }
}
