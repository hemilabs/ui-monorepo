import { type Locale } from 'i18n/routing'
import { parsePath } from 'react-router'
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

// `search` is left out on purpose: `components/link` merges `networkType` into
// `query`, so honouring both would mean one of them silently losing.
export type Href = string | Omit<UrlObject, 'search'>

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
    const { hash = '', pathname = '', search = '' } = parsePath(href)
    return { hash, pathname, search }
  }

  // The pathname can arrive with a query already in it, since `components/link`
  // wraps a plain string href into `{ pathname, query }` to inject networkType,
  // and reading it verbatim would emit a second `?`.
  const fromPathname = parsePath(href.pathname ?? '')
  const query = toSearchParams(href.query)

  const overridden = new Set(query.keys())
  new URLSearchParams(fromPathname.search).forEach(function (value, key) {
    if (!overridden.has(key)) {
      query.append(key, value)
    }
  })

  return {
    hash: prefixed(href.hash ?? '', '#') || fromPathname.hash || '',
    pathname: fromPathname.pathname ?? '',
    search: prefixed(query.toString(), '?'),
  }
}

export const isSamePathOrUnder = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`)

// Trailing slashes are stripped because older bookmarks still carry one, and
// every comparison against a plain path would miss.
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
