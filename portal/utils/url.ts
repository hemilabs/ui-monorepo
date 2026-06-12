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
