import { hasKeys } from './utilities'

export const isRelativeUrl = (url: string) => url.startsWith('/')

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
