import { createParser } from 'nuqs'
import { isAddress } from 'viem'

import { hasKeys } from './utilities'

export const isRelativeUrl = (url: string) => url.startsWith('/')

export const isValidUrl = function (url: string) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const parseAsEvmAddress = createParser({
  parse: (queryValue: string) => (isAddress(queryValue) ? queryValue : null),
  serialize: value => value,
})

export const queryStringObjectToString = function (
  queryString: Record<string, string> = {},
) {
  if (!hasKeys(queryString)) {
    return ''
  }
  const searchParams = new URLSearchParams()
  Object.entries(queryString).forEach(([key, value]) =>
    searchParams.append(key, value),
  )
  return `?${searchParams.toString()}`
}
