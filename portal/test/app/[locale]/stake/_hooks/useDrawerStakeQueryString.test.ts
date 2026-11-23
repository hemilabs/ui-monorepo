import { isDrawerMode } from 'app/[locale]/stake/_hooks/useDrawerStakeQueryString'
import { describe, expect, it } from 'vitest'

describe('isDrawerMode', function () {
  it('returns true for manage', function () {
    expect(isDrawerMode('manage')).toBe(true)
  })

  it.each([null, undefined, '', 'stake', 'staking', 'depositing', 42, {}])(
    'returns false for %s',
    function (value) {
      expect(isDrawerMode(value)).toBe(false)
    },
  )
})
