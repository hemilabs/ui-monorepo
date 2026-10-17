import { EventEmitter } from 'events'
import {
  StakingDashboardStatus,
  type StakingDashboardOperation,
} from 'types/stakingDashboard'
import type { IncreaseAmountEvents } from 've-hemi-actions'
import { describe, expect, it, vi } from 'vitest'

import { registerIncreaseAmountFailureHandlers } from '../../../../../app/[locale]/hemi-stake/_hooks/increaseAmountFailures'

const setup = function () {
  const emitter = new EventEmitter<IncreaseAmountEvents>()
  const updateStakingDashboardOperation = vi.fn(
    (...args: [StakingDashboardOperation?]) => expect(args).toHaveLength(1),
  )
  const track = vi.fn((...args: [string]) => expect(args).toHaveLength(1))
  registerIncreaseAmountFailureHandlers(
    emitter,
    updateStakingDashboardOperation,
    track,
  )
  return { emitter, track, updateStakingDashboardOperation }
}

describe('registerIncreaseAmountFailureHandlers (#2475)', function () {
  it('fails the stake on validation, failure and unexpected errors', function () {
    const { emitter, updateStakingDashboardOperation } = setup()

    emitter.emit('increase-amount-failed-validation', 'reason')
    emitter.emit('increase-amount-failed', new Error('boom'))
    emitter.emit('unexpected-error', new Error('boom'))

    expect(updateStakingDashboardOperation).toHaveBeenCalledTimes(3)
    for (const call of updateStakingDashboardOperation.mock.calls) {
      expect(call[0]).toEqual({
        status: StakingDashboardStatus.STAKE_TX_FAILED,
      })
    }
  })

  it('fails the approval on approve-failed', function () {
    const { emitter, updateStakingDashboardOperation } = setup()

    emitter.emit('approve-failed', new Error('boom'))

    expect(updateStakingDashboardOperation).toHaveBeenCalledTimes(1)
    expect(updateStakingDashboardOperation).toHaveBeenCalledWith({
      status: StakingDashboardStatus.APPROVAL_TX_FAILED,
    })
  })

  it('tracks an analytics event per failure', function () {
    const { emitter, track } = setup()

    emitter.emit('increase-amount-failed-validation', 'reason')
    emitter.emit('approve-failed', new Error('boom'))
    emitter.emit('increase-amount-failed', new Error('boom'))
    emitter.emit('unexpected-error', new Error('boom'))

    expect(track).toHaveBeenCalledTimes(4)
    expect(track).toHaveBeenCalledWith(
      'hemi stake - increase amount failed validation',
    )
    expect(track).toHaveBeenCalledWith(
      'hemi stake - approve increase amount failed',
    )
    expect(track).toHaveBeenCalledWith('hemi stake - increase amount failed')
    expect(track).toHaveBeenCalledWith('hemi stake - unexpected error')
  })

  it('works without a tracker', function () {
    const emitter = new EventEmitter<IncreaseAmountEvents>()
    const updateStakingDashboardOperation = vi.fn(
      (...args: [StakingDashboardOperation?]) => expect(args).toHaveLength(1),
    )
    registerIncreaseAmountFailureHandlers(
      emitter,
      updateStakingDashboardOperation,
    )

    expect(() =>
      emitter.emit('increase-amount-failed', new Error('boom')),
    ).not.toThrow()
    expect(updateStakingDashboardOperation).toHaveBeenCalledWith({
      status: StakingDashboardStatus.STAKE_TX_FAILED,
    })
  })
})
