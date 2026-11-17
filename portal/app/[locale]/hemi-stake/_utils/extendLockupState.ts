import {
  getExtensionAvailableAt,
  getMinExtensionDays,
  getUnlockInfo,
} from './lockCreationTimes'

type ExtendLockupInput = {
  lockTime: bigint | number
  now?: number
  timestamp: bigint | number
}

type ExtendableState = {
  canExtend: true
  extensionAvailableAt?: never
  minLocked: number
}

type NotExtendableState = {
  canExtend: false
  extensionAvailableAt: number
  minLocked?: never
}

export type ExtendLockupState = ExtendableState | NotExtendableState

/**
 * The action always emits `increase-unlock-time-settled` in a `finally`, even after
 * `increase-unlock-time-failed-validation`. Without coordination the settled handler would
 * overwrite the back-to-form `idle` with `staked`, landing on the dead failed step (#2474).
 */
export const createValidationFailureTracker = function () {
  let validationFailed = false
  return {
    consumeSettled() {
      if (!validationFailed) {
        return false
      }
      validationFailed = false
      return true
    },
    markValidationFailed() {
      validationFailed = true
    },
    reset() {
      validationFailed = false
    },
  }
}

/**
 * The extend drawer reads the lock end live instead of the copy taken when the row
 * was clicked: with a stale copy the minimum is wrong and retrying fails forever (#2474).
 * When the position cannot be extended yet, there is no minimum to enforce — the form
 * shows when it becomes available and disables submit instead of falling back to
 * `maxDays` (1461 days).
 */
export const getExtendLockupState = function ({
  lockTime,
  now,
  timestamp,
}: ExtendLockupInput): ExtendLockupState {
  const { currentTimeInSeconds, unlockTime } = getUnlockInfo({
    lockTime,
    timestamp,
  })
  const at = now ?? currentTimeInSeconds
  const minLocked = getMinExtensionDays({ lockEnd: unlockTime, now: at })
  if (minLocked !== null) {
    return { canExtend: true, minLocked }
  }
  return {
    canExtend: false,
    extensionAvailableAt: getExtensionAvailableAt(unlockTime),
  }
}
