import { isDataUnavailable } from 'utils/queryStatus'
import { describe, expect, it } from 'vitest'

describe('utils/queryStatus', function () {
  describe('isDataUnavailable', function () {
    it('returns true for a disabled query (wallet disconnected)', function () {
      expect(
        isDataUnavailable({ fetchStatus: 'idle', status: 'pending' }),
      ).toBe(true)
    })

    it('returns false while actively loading', function () {
      expect(
        isDataUnavailable({ fetchStatus: 'fetching', status: 'pending' }),
      ).toBe(false)
    })

    it('returns true on error', function () {
      expect(isDataUnavailable({ fetchStatus: 'idle', status: 'error' })).toBe(
        true,
      )
    })

    it('returns false for a resolved query that settled to idle', function () {
      expect(
        isDataUnavailable({ fetchStatus: 'idle', status: 'success' }),
      ).toBe(false)
    })

    it('returns false when fetchStatus is unknown and there is no error', function () {
      expect(isDataUnavailable({ status: 'pending' })).toBe(false)
    })
  })
})
