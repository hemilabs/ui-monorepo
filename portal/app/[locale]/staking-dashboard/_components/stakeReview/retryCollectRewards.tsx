import { type FormEvent, useState } from 'react'
import { CollectAllRewardsOperationRunning } from 'types/stakingDashboard'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { useCollectRewards } from '../../_hooks/useCollectAllRewards'

import { RetryForm } from './retryForm'

// Retries a claim on the original rewards contract, which settles a whole position in
// one transaction. The epoch generation retries through its walk, which can resume.
export const RetryCollectRewards = function () {
  const [operationRunning, setOperationRunning] =
    useState<CollectAllRewardsOperationRunning>('idle')

  const {
    collectRewardsDashboardOperation,
    updateCollectRewardsDashboardOperation,
  } = useStakingDashboard()

  // collectRewardsDashboardOperation is defined because this component is only rendered in that case
  const { stakingPosition } = collectRewardsDashboardOperation!

  // this component tries to initiate a new collect rewards, based on the failed one
  const { mutate: runCollectRewards } = useCollectRewards({
    amount: stakingPosition!.amount,
    on(emitter) {
      emitter.on('user-signing-collect-all-rewards-error', function () {
        setOperationRunning('failed')
      })
      emitter.on('collect-all-rewards-transaction-succeeded', function () {
        setOperationRunning('idle')
      })
      emitter.on('collect-all-rewards-transaction-reverted', function () {
        setOperationRunning('failed')
      })
      emitter.on('unexpected-error', () => setOperationRunning('failed'))
    },
    owner: stakingPosition!.owner,
    tokenId: stakingPosition!.tokenId,
    updateCollectRewardsDashboardOperation,
  })

  const handleRetry = function (e: FormEvent) {
    e.preventDefault()
    setOperationRunning('collecting')
    // `onError` as well as the emitter: the mutation can reject before the action even
    // exists (a declined chain switch, no account), leaving the control latched.
    runCollectRewards(undefined, {
      onError: () => setOperationRunning('failed'),
    })
  }

  return (
    <RetryForm
      isCollecting={operationRunning === 'collecting'}
      onRetry={handleRetry}
    />
  )
}
