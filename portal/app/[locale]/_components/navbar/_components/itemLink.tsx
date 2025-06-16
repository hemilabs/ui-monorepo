import { Link } from 'components/link'
import { ComponentProps } from 'react'
import { isRelativeUrl } from 'utils/url'

import { ExternalLink } from './externalLink'
import { NavItemProps } from './navItem'
import { PageLink } from './pageLink'

type ItemLinkProps = NavItemProps &
  Required<Pick<ComponentProps<typeof Link>, 'href'>>

export const ItemLink = (props: ItemLinkProps) =>
  typeof props.href === 'string' && !isRelativeUrl(props.href) ? (
    // @ts-expect-error Typescript fails to detect that props.href must be a string
    <ExternalLink {...props} />
  ) : (
    <PageLink {...props} />
  )
