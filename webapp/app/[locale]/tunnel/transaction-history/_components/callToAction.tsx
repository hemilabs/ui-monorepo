import { ButtonLink } from 'components/button'
import { NetworkType } from 'hooks/useNetworkType'
import { usePathnameWithoutLocale } from 'hooks/usePathnameWithoutLocale'
import { ComponentProps } from 'react'
import { queryStringObjectToString } from 'utils/url'

import { useTunnelOperation } from '../../_hooks/useTunnelOperation'

type QueryStringOptions = {
  networkType: NetworkType
  txHash: string
}

type Props = QueryStringOptions & { text: string } & Required<
    Pick<ComponentProps<typeof ButtonLink>, 'variant'>
  >

export const CallToAction = function ({
  text,
  variant,
  ...queryStringOptions
}: Props) {
  const pathname = usePathnameWithoutLocale()
  const { updateTxHash } = useTunnelOperation()

  const queryString = queryStringObjectToString(queryStringOptions)
  const href = `${pathname}${queryString}`
  return (
    <ButtonLink
      href={href}
      onClick={function (e) {
        // needed as there's event delegation in the row
        e.stopPropagation()
        // prevent full navigation - we want a shallow navigation to open the drawer
        e.preventDefault()
        updateTxHash(queryStringOptions.txHash)
      }}
      variant={variant}
    >
      {text}
    </ButtonLink>
  )
}
