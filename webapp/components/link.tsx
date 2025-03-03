import { defaultNetworkType, useNetworkType } from 'hooks/useNetworkType'
import BaseLink from 'next-intl/link'
import { ComponentProps } from 'react'
import { type UrlObject } from 'url'

const getQuery = function (q: UrlObject['query']): Record<string, string> {
  const query: Record<string, string> = {}

  if (typeof q === 'string') {
    const searchParams = new URLSearchParams(q)
    for (const [key, value] of searchParams.entries()) {
      query[key] = value
    }
  } else if (typeof q === 'object' && q !== null) {
    for (const key in q) {
      if (q[key] !== undefined) {
        query[key] = String(q[key])
      }
    }
  }

  return query
}

// When using link to navigate between pages, we only persist the networkType
// query parameter when it differs from the default network type. This keeps
// the URL clean for the default network while still allowing navigation
// between mainnet and testnet when explicitly selected.
export const Link = function (props: ComponentProps<typeof BaseLink>) {
  const [networkType] = useNetworkType()

  let href = props.href

  if (networkType !== defaultNetworkType) {
    if (typeof href === 'string') {
      href = { pathname: href, query: { networkType } }
    } else {
      href = {
        ...href,
        query: { ...getQuery(href.query), networkType },
      }
    }
  } else if (typeof href !== 'string') {
    href = {
      ...href,
      query: getQuery(href.query),
    }
  }

  return <BaseLink {...props} href={href} />
}
