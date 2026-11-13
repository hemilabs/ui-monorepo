import {
  isRestrictedCountry,
  isRestrictedLocationMeta,
} from 'utils/restrictions'
import { describe, expect, it } from 'vitest'

describe('isRestrictedCountry', function () {
  it('restricts a country on the restricted list', function () {
    expect(isRestrictedCountry({ country: 'US' })).toBe(true)
  })

  it('restricts a country on the sanctioned list', function () {
    expect(isRestrictedCountry({ country: 'IR' })).toBe(true)
  })

  it('allows a country on neither list', function () {
    expect(isRestrictedCountry({ country: 'BR' })).toBe(false)
  })

  it('matches regardless of case', function () {
    expect(isRestrictedCountry({ country: 'us' })).toBe(true)
  })

  it('allows a request that never crossed the edge', function () {
    expect(isRestrictedCountry(undefined)).toBe(false)
  })

  it('restricts when the edge reports no country', function () {
    expect(isRestrictedCountry({})).toBe(true)
  })

  it.each([
    ['Tor', 'T1'],
    ['an unplaceable request', 'XX'],
  ])('restricts %s', function (_name, country) {
    expect(isRestrictedCountry({ country })).toBe(true)
  })
})

describe('isRestrictedLocationMeta', function () {
  it('restricts on the exact value the worker writes', function () {
    expect(isRestrictedLocationMeta('true')).toBe(true)
  })

  it.each([
    ['false', 'false'],
    ['an absent attribute', null],
    ['an absent tag', undefined],
    ['anything else', 'TRUE'],
  ])('does not restrict on %s', function (_name, content) {
    expect(isRestrictedLocationMeta(content)).toBe(false)
  })
})
