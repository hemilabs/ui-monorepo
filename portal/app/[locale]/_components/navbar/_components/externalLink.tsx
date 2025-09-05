import { ExternalLink as AnchorTag } from 'components/externalLink'
import { ArrowDownLeftIcon } from 'components/icons/arrowDownLeftIcon'
import { Link } from 'components/link'
import { useUmami } from 'hooks/useUmami'
import { ComponentProps, Suspense } from 'react'

import {
  IconContainer,
  ItemContainer,
  ItemText,
  NavItemProps,
  Row,
} from './navItem'

type ItemLinkProps = NavItemProps &
  Required<Pick<ComponentProps<typeof Link>, 'href'>>

export const ExternalLinkUI = ({
  href,
  icon,
  onClick,
  text,
}: Omit<ItemLinkProps, 'href'> &
  Pick<ComponentProps<'a'>, 'href' | 'onClick'>) => (
  <ItemContainer>
    <AnchorTag href={href} onClick={onClick}>
      <Row>
        {icon && <IconContainer>{icon}</IconContainer>}
        <ItemText text={text} />
        <div className="ml-auto hidden size-4 items-center group-hover/item:flex">
          <ArrowDownLeftIcon />
        </div>
      </Row>
    </AnchorTag>
  </ItemContainer>
)

const ExternalLinkImpl = function ({
  event,
  ...props
}: Omit<ItemLinkProps, 'href'> & Pick<ComponentProps<'a'>, 'href'>) {
  const { enabled, track } = useUmami()
  return (
    <ExternalLinkUI
      {...props}
      onClick={enabled && event ? () => track(event) : undefined}
    />
  )
}

export const ExternalLink = ({
  event,
  ...props
}: Omit<ItemLinkProps, 'href'> & Pick<ComponentProps<'a'>, 'href'>) => (
  <Suspense fallback={<ExternalLinkUI {...props} />}>
    <ExternalLinkImpl event={event} {...props} />
  </Suspense>
)
