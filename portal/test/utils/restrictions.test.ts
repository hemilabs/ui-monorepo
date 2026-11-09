import {
  isRestrictedCountry,
  isRestrictedLocationMeta,
  parseRestrictions,
} from 'utils/restrictions'
import { describe, expect, it } from 'vitest'

const atTheEdge = { countries: ['GB', 'US'] }

describe('parseRestrictions', function () {
  it('merges both lists the Vetro API returns', function () {
    expect(
      parseRestrictions({
        restrictedCountries: ['GB', 'US'],
        sanctionedCountries: ['IR', 'KP'],
      }),
    ).toStrictEqual(['GB', 'US', 'IR', 'KP'])
  })

  it('drops a code listed in both', function () {
    expect(
      parseRestrictions({
        restrictedCountries: ['US'],
        sanctionedCountries: ['US', 'IR'],
      }),
    ).toStrictEqual(['US', 'IR'])
  })

  it('normalizes the codes so a lowercase entry still matches', function () {
    expect(
      parseRestrictions({
        restrictedCountries: [' us '],
        sanctionedCountries: ['ir'],
      }),
    ).toStrictEqual(['US', 'IR'])
  })

  it('drops entries that are not a code', function () {
    expect(
      parseRestrictions({
        restrictedCountries: ['US', 42, '', null],
        sanctionedCountries: ['IR'],
      }),
    ).toStrictEqual(['US', 'IR'])
  })

  it('accepts empty lists, which mean nothing is restricted', function () {
    expect(
      parseRestrictions({ restrictedCountries: [], sanctionedCountries: [] }),
    ).toStrictEqual([])
  })

  // Taking one list alone would quietly stop blocking the other one.
  it.each([
    ['sanctionedCountries', { restrictedCountries: ['US'] }],
    ['restrictedCountries', { sanctionedCountries: ['IR'] }],
  ])('returns no list when %s is missing', function (_name, payload) {
    expect(parseRestrictions(payload)).toBeUndefined()
  })

  it.each([
    ['nothing', undefined],
    ['null', null],
    ['a string', 'US'],
    ['an object without the keys', {}],
    [
      'a non-array value',
      { restrictedCountries: 'US', sanctionedCountries: [] },
    ],
    [
      'a list with no usable code',
      { restrictedCountries: [42, ''], sanctionedCountries: ['IR'] },
    ],
  ])('returns no list for %s', function (_name, payload) {
    expect(parseRestrictions(payload)).toBeUndefined()
  })
})

describe('isRestrictedCountry', function () {
  it('restricts a country on the list', function () {
    expect(isRestrictedCountry({ ...atTheEdge, cf: { country: 'US' } })).toBe(
      true,
    )
  })

  it('allows a country off the list', function () {
    expect(isRestrictedCountry({ ...atTheEdge, cf: { country: 'BR' } })).toBe(
      false,
    )
  })

  it('matches regardless of case', function () {
    expect(isRestrictedCountry({ ...atTheEdge, cf: { country: 'us' } })).toBe(
      true,
    )
  })

  it('allows an empty list', function () {
    expect(
      isRestrictedCountry({
        cf: { country: 'US' },
        countries: [],
      }),
    ).toBe(false)
  })

  it('allows a request that never crossed the edge, even with no list', function () {
    expect(
      isRestrictedCountry({
        cf: undefined,
        countries: undefined,
      }),
    ).toBe(false)
  })

  it('restricts when the list is unavailable', function () {
    expect(
      isRestrictedCountry({
        cf: { country: 'BR' },
        countries: undefined,
      }),
    ).toBe(true)
  })

  it('restricts when the edge reports no country', function () {
    expect(isRestrictedCountry({ ...atTheEdge, cf: {} })).toBe(true)
  })

  it.each([
    ['Tor', 'T1'],
    ['an unplaceable request', 'XX'],
  ])('restricts %s', function (_name, country) {
    expect(isRestrictedCountry({ ...atTheEdge, cf: { country } })).toBe(true)
  })
})

describe('isRestrictedLocationMeta', function () {
  it('restricts on the exact value the worker writes', function () {
    expect(isRestrictedLocationMeta('true')).toBe(true)
  })

  // An absent tag means no worker in front of the document.
  it.each([
    ['false', 'false'],
    ['an absent attribute', null],
    ['an absent tag', undefined],
    ['anything else', 'TRUE'],
  ])('does not restrict on %s', function (_name, content) {
    expect(isRestrictedLocationMeta(content)).toBe(false)
  })
})
