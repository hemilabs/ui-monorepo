import { isBalanceUnavailable } from 'utils/balance'
import { describe, expect, it } from 'vitest'

describe('utils/balance', function () {
  describe('isBalanceUnavailable', function () {
    it('returns true for a disabled query (wallet disconnected)', function () {
      expect(
        isBalanceUnavailable({ fetchStatus: 'idle', status: 'pending' }),
      ).toBe(true)
    })

    it('returns false while actively loading', function () {
      expect(
        isBalanceUnavailable({ fetchStatus: 'fetching', status: 'pending' }),
      ).toBe(false)
    })

    it('returns true on error', function () {
      expect(
        isBalanceUnavailable({ fetchStatus: 'idle', status: 'error' }),
      ).toBe(true)
    })

    it('returns false when fetchStatus is unknown and there is no error', function () {
      expect(isBalanceUnavailable({ status: 'pending' })).toBe(false)
    })
  })
})
