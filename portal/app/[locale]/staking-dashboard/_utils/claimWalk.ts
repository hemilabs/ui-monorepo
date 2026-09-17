import type {
  ClaimPositionOutcome,
  ClaimStep,
  ClaimStepStatus,
  ClaimWalkPosition,
} from 'types/stakingDashboard'
import type { ClaimEpochRewardsProgress } from 've-hemi-rewards'
import type { Hash } from 'viem'

/**
 * A claim as a list of steps that accumulate rather than being replaced.
 *
 * A claim is bounded, so one logical claim can be several signed transactions and can
 * stop part-way. Showing only "chunk 2 of 3" threw away what chunk 1 had paid, so a
 * half-finished claim looked like a failure with no link to the money received.
 *
 * The same shape carries one position or many, so both go through one renderer.
 */
export const startPosition = function (
  walk: readonly ClaimWalkPosition[],
  { amount, tokenId }: { amount: bigint; tokenId: bigint },
): ClaimWalkPosition[] {
  if (walk.some(position => position.tokenId === tokenId)) {
    return [...walk]
  }
  return [...walk, { amount, steps: [], tokenId }]
}

/**
 * Records where one position's claim has got to.
 *
 * Steps are keyed by chunk number, so signed-then-confirmed updates in place instead of
 * appending. An earlier step still on `signing` is left alone - marking it is the
 * caller's job, and rewriting it here would erase a real outcome.
 */
export const recordStep = (
  walk: readonly ClaimWalkPosition[],
  {
    progress,
    status,
    tokenId,
    transactionHash,
  }: {
    progress: ClaimEpochRewardsProgress
    status: ClaimStepStatus
    tokenId: bigint
    transactionHash?: Hash
  },
): ClaimWalkPosition[] =>
  walk.map(function (position) {
    if (position.tokenId !== tokenId) {
      return position
    }
    const existing = position.steps.find(step => step.chunk === progress.chunk)
    const step: ClaimStep = {
      chunk: progress.chunk,
      chunks: progress.chunks,
      from: progress.from,
      status,
      to: progress.to,
      // Kept when a later event carries none - a confirmation arrives without the hash
      // the signature already gave us.
      transactionHash: transactionHash ?? existing?.transactionHash,
    }
    return {
      ...position,
      steps: existing
        ? position.steps.map(current =>
            current.chunk === progress.chunk ? step : current,
          )
        : [...position.steps, step],
    }
  })

// Closes a position off, settling any step left mid-flight so nothing keeps spinning
// after the claim has stopped.
export const finishPosition = function (
  walk: readonly ClaimWalkPosition[],
  { outcome, tokenId }: { outcome: ClaimPositionOutcome; tokenId: bigint },
): ClaimWalkPosition[] {
  const stopped: ClaimStepStatus =
    outcome === 'declined'
      ? 'declined'
      : outcome === 'failed'
        ? 'failed'
        : 'confirmed'

  return walk.map(function (position) {
    if (position.tokenId !== tokenId) {
      return position
    }
    return {
      ...position,
      outcome,
      steps: position.steps.map(step =>
        step.status === 'signing' || step.status === 'waiting'
          ? { ...step, status: stopped }
          : step,
      ),
    }
  })
}

// How many steps actually confirmed. Tells "nothing happened" apart from "some of it
// happened" - a failure from an interruption.
export const settledSteps = (walk: readonly ClaimWalkPosition[]) =>
  walk.reduce(
    (total, position) =>
      total + position.steps.filter(step => step.status === 'confirmed').length,
    0,
  )

// How a whole walk ended. A failure anywhere outranks a decline and both outrank the
// total, since paying two positions and failing on the third is not a success.
export const walkOutcome = function (
  walk: readonly ClaimWalkPosition[],
): ClaimPositionOutcome {
  if (walk.some(position => position.outcome === 'failed')) {
    return 'failed'
  }
  if (walk.some(position => position.outcome === 'declined')) {
    return 'declined'
  }
  return settledSteps(walk) > 0 ? 'paid' : 'nothing-owed'
}
