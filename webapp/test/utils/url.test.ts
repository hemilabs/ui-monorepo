import { isRelativeUrl, queryStringObjectToString } from 'utils/url'
import { describe, expect, it } from 'vitest'

describe('utils/url', function () {
  describe('isRelativeUrl', function () {
    it('should return true for relative urls', function () {
      expect(isRelativeUrl('/test')).toBe(true)
    })

    it('should return false for full urls', function () {
      expect(isRelativeUrl('https://google.com.ar/')).toBe(false)
    })
  })

  describe('queryStringObjectToString', function () {
    it('should return an empty string when no value is provided', function () {
      expect(queryStringObjectToString()).toBe('')
    })

    it('should return an empty string for an empty object', function () {
      expect(queryStringObjectToString({})).toBe('')
    })

    it('should return a query string for an object', function () {
      expect(queryStringObjectToString({ a: 'b', c: 'd', e: '3' })).toBe(
        '?a=b&c=d&e=3',
      )
    })
  })
})
