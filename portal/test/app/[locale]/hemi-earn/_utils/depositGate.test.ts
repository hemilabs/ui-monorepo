import { describe, expect, it } from 'vitest'

import { resolveDepositGate } from '../../../../../app/[locale]/hemi-earn/_utils/depositGate'

const nothingBlocks = {
  depositsPaused: false,
  isListed: true,
  isSanctioned: false,
  isScreening: false,
  restrictedLocation: false,
  screeningFailed: false,
}

describe('resolveDepositGate', function () {
  it('allows deposits when nothing blocks them', function () {
    expect(resolveDepositGate(nothingBlocks)).toStrictEqual({
      canDeposit: true,
      isChecking: false,
      reason: undefined,
    })
  })

  // The screening is in flight, so the action is blocked but no copy is shown
  // yet: a reason here would flash a block the visitor may not be under.
  it('blocks without a reason while the screening runs', function () {
    expect(
      resolveDepositGate({ ...nothingBlocks, isScreening: true }),
    ).toStrictEqual({
      canDeposit: false,
      isChecking: true,
      reason: undefined,
    })
  })

  it('blocks deposits when they are paused', function () {
    expect(
      resolveDepositGate({ ...nothingBlocks, depositsPaused: true }),
    ).toStrictEqual({
      canDeposit: false,
      isChecking: false,
      reason: 'deposits-paused',
    })
  })

  it('blocks deposits into a delisted vault', function () {
    expect(
      resolveDepositGate({ ...nothingBlocks, isListed: false }),
    ).toStrictEqual({
      canDeposit: false,
      isChecking: false,
      reason: 'vault-delisted',
    })
  })

  it('blocks a restricted location', function () {
    expect(
      resolveDepositGate({ ...nothingBlocks, restrictedLocation: true }),
    ).toStrictEqual({
      canDeposit: false,
      isChecking: false,
      reason: 'restricted-location',
    })
  })

  it('blocks a sanctioned wallet', function () {
    expect(
      resolveDepositGate({ ...nothingBlocks, isSanctioned: true }),
    ).toStrictEqual({
      canDeposit: false,
      isChecking: false,
      reason: 'sanctioned-wallet',
    })
  })

  it('blocks when the screening failed', function () {
    expect(
      resolveDepositGate({ ...nothingBlocks, screeningFailed: true }),
    ).toStrictEqual({
      canDeposit: false,
      isChecking: false,
      reason: 'screening-unavailable',
    })
  })

  // What is known synchronously is reported before anything that waits on the
  // network, so an already-paused or geo-blocked form does not render twice.
  // A restricted location outranks the delisting because it blocks every vault,
  // and naming the vault would invite trying another one.
  it.each([
    ['deposits-paused', { depositsPaused: true, restrictedLocation: true }],
    ['deposits-paused', { depositsPaused: true, isListed: false }],
    ['restricted-location', { isScreening: true, restrictedLocation: true }],
    ['restricted-location', { isListed: false, restrictedLocation: true }],
    ['sanctioned-wallet', { isSanctioned: true, screeningFailed: true }],
    ['vault-delisted', { isListed: false, isScreening: true }],
  ])('reports %s first', function (reason, overrides) {
    expect(resolveDepositGate({ ...nothingBlocks, ...overrides }).reason).toBe(
      reason,
    )
  })

  it('holds the screening above the wallet verdict', function () {
    expect(
      resolveDepositGate({
        ...nothingBlocks,
        isSanctioned: true,
        isScreening: true,
      }).isChecking,
    ).toBe(true)
  })
})
