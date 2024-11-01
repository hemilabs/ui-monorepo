import { useNetworkType } from 'hooks/useNetworkType'
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

// When using link to navigate between pages, we need to persist the query string
// for network type; otherwise, when navigating, users would switch between mainnet and testnet
// due to the loss of this value
export const Link = function (props: ComponentProps<typeof BaseLink>) {
  const [networkType] = useNetworkType()
  const href =
    typeof props.href === 'string'
      ? { pathname: props.href, query: { networkType } }
      : { ...props.href, query: { ...getQuery(props.href.query), networkType } }
  return <BaseLink {...props} href={href} />
}
