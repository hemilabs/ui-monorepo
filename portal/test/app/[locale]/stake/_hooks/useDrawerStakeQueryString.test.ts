import { isDrawerMode } from 'app/[locale]/stake/_hooks/useDrawerStakeQueryString'
import { describe, expect, it } from 'vitest'

describe('isDrawerMode', function () {
  it.each(['manage', 'stake'])('returns true for %s', function (value) {
    expect(isDrawerMode(value)).toBe(true)
  })

  it.each([null, undefined, '', 'staking', 'depositing', 42, {}])(
    'returns false for %s',
    function (value) {
      expect(isDrawerMode(value)).toBe(false)
    },
  )
})
