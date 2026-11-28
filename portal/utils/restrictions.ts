import {
  restrictedCountries,
  sanctionedCountries,
} from '@vetro-protocol/hemi-earn/restrictions'

const blockedCountries = new Set([
  ...restrictedCountries,
  ...sanctionedCountries,
])

export const restrictedLocationMetaName = 'hemi-earn-restricted'

export const isRestrictedLocationMeta = (content: string | null | undefined) =>
  content !== 'false'

export const isRestrictedCountry = function (
  cf: { country?: string } | undefined,
) {
  if (cf === undefined) {
    return true
  }
  return blockedCountries.has(cf.country?.toUpperCase() ?? '')
}
