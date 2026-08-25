import { type Locale } from 'i18n/routing'
import { type UrlObject } from 'url'

export const isRelativeUrl = (url: string) => url.startsWith('/')

export const isValidUrl = function (url: string) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const queryStringObjectToString = function (
  queryString: Record<string, string> = {},
) {
  const stringified = new URLSearchParams(queryString).toString()
  return stringified ? `?${stringified}` : ''
}

export type Href = string | UrlObject

const toSearchParams = function (query: UrlObject['query']) {
  if (typeof query === 'string') {
    return new URLSearchParams(query)
  }

  const searchParams = new URLSearchParams()
  if (typeof query !== 'object' || query === null) {
    return searchParams
  }

  Object.entries(query).forEach(function ([key, value]) {
    if (value === undefined || value === null) {
      return
    }
    if (Array.isArray(value)) {
      value.forEach(item => searchParams.append(key, String(item)))
      return
    }
    searchParams.append(key, String(value))
  })

  return searchParams
}

const prefixed = function (value: string, character: string) {
  if (!value) {
    return ''
  }
  return value.startsWith(character) ? value : `${character}${value}`
}

export const toLocation = function (href: Href) {
  if (typeof href === 'string') {
    const [beforeHash = '', ...hashParts] = href.split('#')
    const [pathname = '', ...searchParts] = beforeHash.split('?')
    return {
      hash: prefixed(hashParts.join('#'), '#'),
      pathname,
      search: prefixed(searchParts.join('?'), '?'),
    }
  }

  return {
    hash: prefixed(href.hash ?? '', '#'),
    pathname: href.pathname ?? '',
    search: prefixed(toSearchParams(href.query).toString(), '?'),
  }
}

// Next's static export produced trailing slashes, so call sites used to compare
// against `/tunnel/`. react-router pathnames have none, which silently made
// those checks miss the section root.
export const isSamePathOrUnder = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`)

// Strips the locale segment and any trailing slash. Next's static export
// produced both, so bookmarks from before the migration still carry a trailing
// slash that every comparison against a plain path would miss.
export const unlocalizedPathname = function (pathname: string, locale: Locale) {
  const prefix = `/${locale}`
  const unlocalized = pathname.startsWith(`${prefix}/`)
    ? pathname.slice(prefix.length)
    : pathname === prefix
      ? '/'
      : pathname

  const trimmed = unlocalized.replace(/\/+$/, '')
  return trimmed || '/'
}
