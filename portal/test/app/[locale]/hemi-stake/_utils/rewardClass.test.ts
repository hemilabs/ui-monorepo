import { getRewardClassAt } from 'app/[locale]/hemi-stake/_utils/rewardClass'
import { describe, expect, it } from 'vitest'

const transferableAfter = 1795101480

describe('getRewardClassAt', function () {
  it('is transferable from the instant it turns transferable', function () {
    expect(
      getRewardClassAt({
        at: transferableAfter,
        forfeitable: true,
        transferableAfter,
      }),
    ).toBe('transferable')
  })

  it('is still its own class one second earlier', function () {
    expect(
      getRewardClassAt({
        at: transferableAfter - 1,
        forfeitable: true,
        transferableAfter,
      }),
    ).toBe('forfeitable')
  })

  it('leaves a forfeitable position out of its own pot once the instant passed', function () {
    expect(
      getRewardClassAt({
        at: transferableAfter + 525_960,
        forfeitable: true,
        transferableAfter,
      }),
    ).toBe('transferable')
  })

  it('is locked rather than forfeitable while it cannot be forfeited', function () {
    expect(
      getRewardClassAt({
        at: transferableAfter - 1,
        forfeitable: false,
        transferableAfter,
      }),
    ).toBe('locked')
  })

  it('is transferable at every instant for a position that never waits', function () {
    expect(
      getRewardClassAt({ at: 0, forfeitable: false, transferableAfter: 0 }),
    ).toBe('transferable')
    expect(
      getRewardClassAt({
        at: transferableAfter,
        forfeitable: false,
        transferableAfter: 0,
      }),
    ).toBe('transferable')
  })

  it('does not let forfeitability outlive the instant for an always transferable position', function () {
    expect(
      getRewardClassAt({ at: 0, forfeitable: true, transferableAfter: 0 }),
    ).toBe('transferable')
  })
})
