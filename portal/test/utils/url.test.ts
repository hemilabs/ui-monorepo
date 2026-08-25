import {
  isRelativeUrl,
  isSamePathOrUnder,
  isValidUrl,
  queryStringObjectToString,
  toLocation,
  unlocalizedPathname,
} from 'utils/url'
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

  describe('isValidUrl', function () {
    it('should return true for a valid URL', function () {
      expect(isValidUrl('https://example.com/path?name=value')).toBe(true)
    })

    it('should return false for an invalid URL', function () {
      expect(isValidUrl('invalid-url')).toBe(false)
    })

    it('should return false for an empty string', function () {
      expect(isValidUrl('')).toBe(false)
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

  describe('toLocation', function () {
    it('splits a plain string path', function () {
      expect(toLocation('/tunnel')).toEqual({
        hash: '',
        pathname: '/tunnel',
        search: '',
      })
    })

    it('splits search and hash out of a string', function () {
      expect(toLocation('/tunnel?networkType=testnet#top')).toEqual({
        hash: '#top',
        pathname: '/tunnel',
        search: '?networkType=testnet',
      })
    })

    it('keeps extra separators inside the search and the hash', function () {
      expect(toLocation('/p?a=1?2#x#y')).toEqual({
        hash: '#x#y',
        pathname: '/p',
        search: '?a=1?2',
      })
    })

    it('builds the search from an object query', function () {
      expect(
        toLocation({ pathname: '/stake', query: { networkType: 'mainnet' } }),
      ).toEqual({
        hash: '',
        pathname: '/stake',
        search: '?networkType=mainnet',
      })
    })

    it('accepts a query already serialized as a string', function () {
      expect(toLocation({ pathname: '/stake', query: 'a=1&b=2' })).toEqual({
        hash: '',
        pathname: '/stake',
        search: '?a=1&b=2',
      })
    })

    it('drops undefined and null values', function () {
      expect(
        toLocation({
          pathname: '/stake',
          query: { a: undefined, b: null, c: 'kept' },
        }),
      ).toEqual({ hash: '', pathname: '/stake', search: '?c=kept' })
    })

    it('stringifies numbers and booleans', function () {
      expect(
        toLocation({ pathname: '/p', query: { n: 1, ok: false } }),
      ).toEqual({ hash: '', pathname: '/p', search: '?n=1&ok=false' })
    })

    it('splits a query already embedded in the pathname', function () {
      expect(
        toLocation({
          pathname: '/stake/dashboard?mode=manage',
          query: { networkType: 'testnet' },
        }),
      ).toEqual({
        hash: '',
        pathname: '/stake/dashboard',
        search: '?networkType=testnet&mode=manage',
      })
    })

    it('lets the query object win over the embedded one', function () {
      expect(
        toLocation({
          pathname: '/p?networkType=mainnet',
          query: { networkType: 'testnet' },
        }),
      ).toEqual({
        hash: '',
        pathname: '/p',
        search: '?networkType=testnet',
      })
    })

    it('keeps a hash embedded in the pathname', function () {
      expect(toLocation({ pathname: '/p#top' })).toEqual({
        hash: '#top',
        pathname: '/p',
        search: '',
      })
    })

    it('repeats a key for array values instead of joining them', function () {
      expect(
        toLocation({ pathname: '/p', query: { tag: ['a', 'b'] } }),
      ).toEqual({ hash: '', pathname: '/p', search: '?tag=a&tag=b' })
    })

    it('normalizes a hash that already carries its separator', function () {
      expect(toLocation({ hash: '#top', pathname: '/p' })).toEqual({
        hash: '#top',
        pathname: '/p',
        search: '',
      })
      expect(toLocation({ hash: 'top', pathname: '/p' })).toEqual({
        hash: '#top',
        pathname: '/p',
        search: '',
      })
    })
  })

  describe('isSamePathOrUnder', function () {
    it('matches the section root itself', function () {
      expect(isSamePathOrUnder('/tunnel', '/tunnel')).toBe(true)
    })

    it('matches a path under the section', function () {
      expect(isSamePathOrUnder('/tunnel/transaction-history', '/tunnel')).toBe(
        true,
      )
    })

    it('does not match a sibling that merely shares the prefix', function () {
      expect(isSamePathOrUnder('/tunnels', '/tunnel')).toBe(false)
      expect(isSamePathOrUnder('/tunnel-history', '/tunnel')).toBe(false)
    })

    it('does not match an unrelated path', function () {
      expect(isSamePathOrUnder('/stake', '/tunnel')).toBe(false)
    })
  })

  describe('unlocalizedPathname', function () {
    it('strips the locale segment', function () {
      expect(unlocalizedPathname('/en/tunnel', 'en')).toBe('/tunnel')
      expect(unlocalizedPathname('/pt/tunnel/transaction-history', 'pt')).toBe(
        '/tunnel/transaction-history',
      )
    })

    it('drops the trailing slash a Next bookmark still carries', function () {
      expect(unlocalizedPathname('/en/tunnel/', 'en')).toBe('/tunnel')
      expect(unlocalizedPathname('/es/stake/dashboard/', 'es')).toBe(
        '/stake/dashboard',
      )
    })

    it('returns the root for the locale on its own', function () {
      expect(unlocalizedPathname('/en', 'en')).toBe('/')
      expect(unlocalizedPathname('/en/', 'en')).toBe('/')
    })

    it('leaves a path that does not carry the locale alone', function () {
      expect(unlocalizedPathname('/tunnel', 'en')).toBe('/tunnel')
    })

    it('does not strip a segment that merely starts with the locale', function () {
      expect(unlocalizedPathname('/entities', 'en')).toBe('/entities')
      expect(unlocalizedPathname('/english/docs', 'en')).toBe('/english/docs')
    })
  })
})
