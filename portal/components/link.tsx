import { defaultNetworkType, useNetworkType } from 'hooks/useNetworkType'
import { Link as BaseLink } from 'i18n/navigation'
import { ComponentProps, Suspense } from 'react'
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
const LinkImpl = function (props: ComponentProps<typeof BaseLink>) {
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

export const Link = (props: ComponentProps<typeof BaseLink>) => (
  // The link implementation adds the NetworkType query string to the URL only if it is not mainnet
  // Other than that, it's a regular link. That's why the fallback can be the regular link, without modifying
  // the href
  <Suspense fallback={<BaseLink {...props} />}>
    <LinkImpl {...props} />
  </Suspense>
)
