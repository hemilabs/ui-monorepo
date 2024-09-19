import { ButtonLink } from 'components/button'
import { NetworkType } from 'hooks/useNetworkType'
import { ComponentProps } from 'react'

import { Operation } from '../../_hooks/useTunnelState'

type QueryStringOptions = {
  networkType: NetworkType
  operation: Operation
  txHash: string
}

export const getCallToActionUrl = function (options: QueryStringOptions) {
  const searchParams = new URLSearchParams()
  Object.entries(options).forEach(([key, value]) =>
    searchParams.append(key, value),
  )
  return `/tunnel?${searchParams.toString()}`
}

type Props = QueryStringOptions & { text: string } & Required<
    Pick<ComponentProps<typeof ButtonLink>, 'variant'>
  >

export const CallToAction = ({
  text,
  variant,
  ...queryStringOptions
}: Props) => (
  <ButtonLink
    href={getCallToActionUrl(queryStringOptions)}
    // needed as there's event delegation in the row
    onClick={e => e.stopPropagation()}
    variant={variant}
  >
    {text}
  </ButtonLink>
)
