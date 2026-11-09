// Not real countries: T1 is how Cloudflare marks a Tor exit, and XX is the
// placeholder it is reported to use when it cannot place the request. Neither
// can be checked against the lists, so both are treated as restricted.
const unplaceableCountries = ['T1', 'XX']

export const restrictedLocationMetaName = 'hemi-earn-restricted'

export const isRestrictedLocationMeta = (content: string | null | undefined) =>
  content === 'true'

const parseCountryList = function (value: unknown) {
  if (!Array.isArray(value)) {
    return undefined
  }

  const codes = value
    .filter(code => typeof code === 'string')
    .map(code => code.trim().toUpperCase())
    .filter(code => code.length > 0)

  return value.length > 0 && codes.length === 0 ? undefined : codes
}

export const parseRestrictions = function (payload: unknown) {
  if (payload === null || typeof payload !== 'object') {
    return undefined
  }

  const { restrictedCountries, sanctionedCountries } = payload as {
    restrictedCountries?: unknown
    sanctionedCountries?: unknown
  }
  const restricted = parseCountryList(restrictedCountries)
  const sanctioned = parseCountryList(sanctionedCountries)
  if (restricted === undefined || sanctioned === undefined) {
    return undefined
  }

  return Array.from(new Set([...restricted, ...sanctioned]))
}

export const isRestrictedCountry = function ({
  cf,
  countries,
}: {
  cf: { country?: string } | undefined
  countries: string[] | undefined
}) {
  if (cf === undefined) {
    return false
  }
  if (countries === undefined) {
    return true
  }
  if (cf.country === undefined || unplaceableCountries.includes(cf.country)) {
    return true
  }
  return countries.includes(cf.country.toUpperCase())
}
