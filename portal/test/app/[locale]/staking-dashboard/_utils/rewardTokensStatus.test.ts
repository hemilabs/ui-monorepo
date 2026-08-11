import { getRewardTokensStatus } from 'app/[locale]/staking-dashboard/_utils/rewardTokensStatus'
import { describe, expect, it } from 'vitest'

describe('getRewardTokensStatus', function () {
  it('is pending while the addresses query has not resolved', function () {
    expect(
      getRewardTokensStatus({ addressesStatus: 'pending', tokenStatuses: [] }),
    ).toEqual({ hasError: false, isPending: true })
  })

  it('errors when the addresses query fails', function () {
    expect(
      getRewardTokensStatus({ addressesStatus: 'error', tokenStatuses: [] }),
    ).toEqual({ hasError: true, isPending: false })
  })

  it('settles when the addresses query resolves with no tokens', function () {
    expect(
      getRewardTokensStatus({ addressesStatus: 'success', tokenStatuses: [] }),
    ).toEqual({ hasError: false, isPending: false })
  })

  it('is pending while any token query has not resolved', function () {
    expect(
      getRewardTokensStatus({
        addressesStatus: 'success',
        tokenStatuses: ['success', 'pending'],
      }),
    ).toEqual({ hasError: false, isPending: true })
  })

  it('errors when any token query fails', function () {
    expect(
      getRewardTokensStatus({
        addressesStatus: 'success',
        tokenStatuses: ['success', 'error'],
      }),
    ).toEqual({ hasError: true, isPending: false })
  })

  it('settles when every query resolves', function () {
    expect(
      getRewardTokensStatus({
        addressesStatus: 'success',
        tokenStatuses: ['success', 'success'],
      }),
    ).toEqual({ hasError: false, isPending: false })
  })
})
