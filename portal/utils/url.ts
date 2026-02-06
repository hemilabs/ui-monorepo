import { createParser } from 'nuqs'
import { isAddress } from 'viem'

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
  const stringified = new URLSearchParams(queryString).toString()
  return stringified ? `?${stringified}` : ''
}
