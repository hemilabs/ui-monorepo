import { isTransientLockFailure } from 'app/[locale]/hemi-stake/_utils/lockupValidationFailure'
import { describe, expect, it } from 'vitest'

describe('isTransientLockFailure', function () {
  it('treats a lock status that could not be read as transient', function () {
    expect(isTransientLockFailure('failed to check lock status')).toBe(true)
    expect(isTransientLockFailure('failed to validate inputs')).toBe(true)
  })

  it('treats a lock that no longer matches the snapshot as stale data', function () {
    expect(isTransientLockFailure('lock already expired')).toBe(false)
    expect(isTransientLockFailure('no existing lock')).toBe(false)
    expect(isTransientLockFailure('wallet client chain is not defined')).toBe(
      false,
    )
    expect(
      isTransientLockFailure(
        'new unlock time must be greater than current unlock time',
      ),
    ).toBe(false)
  })
})
