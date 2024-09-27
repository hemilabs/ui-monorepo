import { ButtonLink } from 'components/button'
import { NetworkType } from 'hooks/useNetworkType'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ComponentProps } from 'react'

import { useTunnelOperation } from '../../_hooks/useTunnelOperation'

type QueryStringOptions = {
  networkType: NetworkType
  txHash: string
}

const getCallToActionQueryString = function (options: QueryStringOptions) {
  const searchParams = new URLSearchParams()
  Object.entries(options).forEach(([key, value]) =>
    searchParams.append(key, value),
  )
  return `?${searchParams.toString()}`
}

type Props = QueryStringOptions & { text: string } & Required<
    Pick<ComponentProps<typeof ButtonLink>, 'variant'>
  >

export const CallToAction = function ({
  text,
  variant,
  ...queryStringOptions
}: Props) {
  const locale = useLocale()
  const pathname = usePathname().replace(`/${locale}`, '')
  const { updateTxHash } = useTunnelOperation()

  const queryString = getCallToActionQueryString(queryStringOptions)
  const href = `${pathname}${queryString}`
  return (
    <ButtonLink
      href={href}
      onClick={function (e) {
        // needed as there's event delegation in the row
        e.stopPropagation()
        // prevent full navigation - we want a shallow navigation to open the drawer
        // See https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating#using-the-native-history-api
        e.preventDefault()
        updateTxHash(queryStringOptions.txHash)
        window.history.pushState(null, '', queryString)
      }}
      variant={variant}
    >
      {text}
    </ButtonLink>
  )
}
