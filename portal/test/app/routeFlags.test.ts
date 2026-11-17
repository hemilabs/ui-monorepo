import { getRouteFlags } from 'app/routeFlags'
import { describe, expect, it } from 'vitest'

describe('app/routeFlags', function () {
  it('should turn on only the flags set to "true"', function () {
    expect(
      getRouteFlags({
        VITE_ENABLE_HEMI_EARN_PAGE: 'true',
        VITE_ENABLE_HEMI_STAKE_CALCULATOR: 'false',
      }),
    ).toEqual({ hemiEarn: true, hemiStakeCalculator: false })
  })

  it('should turn off the flags that are not set', function () {
    expect(getRouteFlags({})).toEqual({
      hemiEarn: false,
      hemiStakeCalculator: false,
    })
  })
})
