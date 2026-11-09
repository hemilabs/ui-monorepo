import { resolveRecoveryActions } from 'app/[locale]/hemi-earn/_utils/recoveryActions'
import { describe, expect, it } from 'vitest'

const deposit = {
  canDeposit: true,
  category: undefined,
  isDeposit: true,
  reason: undefined,
}

describe('resolveRecoveryActions', function () {
  it('offers both actions on an unblocked deposit', function () {
    expect(resolveRecoveryActions(deposit)).toStrictEqual({
      cancelOnly: false,
      retryBlocked: false,
    })
  })

  it('drops retry on slippage, whatever the gate says', function () {
    expect(
      resolveRecoveryActions({ ...deposit, category: 'slippage' }),
    ).toStrictEqual({ cancelOnly: true, retryBlocked: false })
  })

  it.each([
    'deposits-paused',
    'restricted-location',
    'sanctioned-wallet',
  ] as const)('drops retry while %s blocks deposits', function (reason) {
    expect(
      resolveRecoveryActions({ ...deposit, canDeposit: false, reason }),
    ).toStrictEqual({ cancelOnly: true, retryBlocked: true })
  })

  // A transient read failure must not leave the irreversible cancel as the
  // only way out, but it still cannot let the deposit through.
  it('keeps retry on screen but disabled when the screening failed', function () {
    expect(
      resolveRecoveryActions({
        ...deposit,
        canDeposit: false,
        reason: 'screening-unavailable',
      }),
    ).toStrictEqual({ cancelOnly: false, retryBlocked: true })
  })

  it('keeps retry on screen but disabled while the screening runs', function () {
    expect(
      resolveRecoveryActions({ ...deposit, canDeposit: false }),
    ).toStrictEqual({ cancelOnly: false, retryBlocked: true })
  })

  it('leaves a withdrawal alone, the deposit gate does not apply', function () {
    expect(
      resolveRecoveryActions({
        ...deposit,
        canDeposit: false,
        isDeposit: false,
        reason: 'sanctioned-wallet',
      }),
    ).toStrictEqual({ cancelOnly: false, retryBlocked: false })
  })
})
