import { Link } from 'components/link'
import { usePathnameWithoutLocale } from 'hooks/usePathnameWithoutLocale'
import { useUmami } from 'hooks/useUmami'
import { Suspense } from 'react'

import {
  IconContainer,
  ItemContainer,
  ItemLinkProps,
  ItemText,
  Row,
} from './navItem'

type Props = {
  selected?: boolean
  onClick?: () => void
} & ItemLinkProps

const PageLinkUI = ({
  href,
  icon,
  onClick,
  rightSection,
  selected,
  text,
}: Omit<Props, 'event' | 'urlToBeSelected'>) => (
  <ItemContainer onClick={onClick} selected={selected}>
    <Link href={href}>
      <Row>
        <IconContainer selected={selected}>{icon}</IconContainer>
        <ItemText selected={selected} text={text} />
        {rightSection}
      </Row>
    </Link>
  </ItemContainer>
)

const PageLinkImpl = function ({
  event,
  ...props
}: Omit<Props, 'urlToBeSelected'>) {
  const { enabled, track } = useUmami()

  return (
    <PageLinkUI
      {...props}
      onClick={enabled && !!event ? () => track(event) : undefined}
    />
  )
}

export const PageLink = function ({
  event,
  href,
  icon,
  rightSection,
  text,
  urlToBeSelected = href,
}: ItemLinkProps) {
  const pathname = usePathnameWithoutLocale()

  const selected =
    typeof urlToBeSelected === 'string'
      ? pathname.startsWith(urlToBeSelected)
      : pathname.startsWith(urlToBeSelected.pathname)

  const props = {
    href,
    icon,
    rightSection,
    selected,
    text,
  }

  return (
    <Suspense fallback={<PageLinkUI {...props} />}>
      <PageLinkImpl event={event} {...props} />
    </Suspense>
  )
}
