import {
  restrictedCountries,
  sanctionedCountries,
} from '@vetro-protocol/hemi-earn/restrictions'

const blockedCountries = new Set([
  ...restrictedCountries,
  ...sanctionedCountries,
])

// Not real countries: T1 is how Cloudflare marks a Tor exit, and XX is the
// placeholder it is reported to use when it cannot place the request. Neither
// can be checked against the lists, so both are treated as restricted.
const unplaceableCountries = ['T1', 'XX']

export const restrictedLocationMetaName = 'hemi-earn-restricted'

export const isRestrictedLocationMeta = (content: string | null | undefined) =>
  content !== 'false'

export const isRestrictedCountry = function (
  cf: { country?: string } | undefined,
) {
  const country = cf?.country?.toUpperCase()
  if (country === undefined || unplaceableCountries.includes(country)) {
    return true
  }
  return blockedCountries.has(country)
}
