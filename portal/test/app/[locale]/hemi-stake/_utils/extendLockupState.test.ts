import { describe, expect, it } from 'vitest'

import {
  createValidationFailureTracker,
  getExtendLockupState,
  type ExtendLockupState,
} from '../../../../../app/[locale]/hemi-stake/_utils/extendLockupState'
import { maxDays } from '../../../../../app/[locale]/hemi-stake/_utils/lockCreationTimes'

const day = 86400

describe('getExtendLockupState (#2474)', function () {
  it('extends from a live lock end with a recomputed minimum', function () {
    const timestamp = 1_700_000_000
    const lockTime = 1461 * day
    // Well past the extension window: extendable.
    const state = getExtendLockupState({
      lockTime,
      now: timestamp + 100 * day,
      timestamp,
    })

    expect(state.canExtend).toBe(true)
    const extendable = state as Extract<ExtendLockupState, { canExtend: true }>
    expect(typeof extendable.minLocked).toBe('number')
    expect(extendable.minLocked).toBeLessThanOrEqual(maxDays)
  })

  it('reports not-extendable with the availability date instead of a fallback', function () {
    const timestamp = 1_700_000_000
    const lockTime = 1461 * day
    // One day in: the extension window is still shut.
    const state = getExtendLockupState({
      lockTime,
      now: timestamp + day,
      timestamp,
    })

    expect(state.canExtend).toBe(false)
    const locked = state as Extract<ExtendLockupState, { canExtend: false }>
    // In the future (getLockEnd snaps the lock end to the epoch grid).
    expect(locked.extensionAvailableAt).toBeGreaterThan(timestamp + day)
    expect(locked.extensionAvailableAt).toBeLessThanOrEqual(
      timestamp + lockTime + 7 * day,
    )
    expect(locked.minLocked).toBeUndefined()
  })

  it('accepts bigint lock values as stored on positions', function () {
    const state = getExtendLockupState({
      lockTime: BigInt(1461 * day),
      now: 1_700_000_000 + 100 * day,
      timestamp: BigInt(1_700_000_000),
    })

    expect(state.canExtend).toBe(true)
  })
})

describe('createValidationFailureTracker (#2474)', function () {
  it('skips the settled transition after a validation failure', function () {
    const tracker = createValidationFailureTracker()

    tracker.markValidationFailed()

    expect(tracker.consumeSettled()).toBe(true)
  })

  it('lets settled through otherwise, exactly once per mark', function () {
    const tracker = createValidationFailureTracker()

    expect(tracker.consumeSettled()).toBe(false)

    tracker.markValidationFailed()
    expect(tracker.consumeSettled()).toBe(true)
    expect(tracker.consumeSettled()).toBe(false)
  })
})

describe('createValidationFailureTracker reset (#2474)', function () {
  it('clears a stale flag set from a retry whose settled never arrives', function () {
    const tracker = createValidationFailureTracker()

    tracker.markValidationFailed()
    tracker.reset()

    expect(tracker.consumeSettled()).toBe(false)
  })
})
