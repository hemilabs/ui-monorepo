import { Link } from 'components/link'
import { useUmami } from 'hooks/useUmami'
import { usePathname } from 'i18n/navigation'
import { cloneElement, isValidElement, Suspense } from 'react'
import { isSamePathOrUnder } from 'utils/url'

import { IconContainer as DefaultIconContainer } from './iconContainer'
import { ItemContainer, ItemLinkProps, ItemText, Row } from './navItem'

type Props = {
  selected?: boolean
  onClick?: () => void
} & ItemLinkProps

const PageLinkUI = ({
  href,
  icon,
  iconContainer: IconContainer = DefaultIconContainer,
  itemContainer: ContainerComponent = ItemContainer,
  onClick,
  rightSection,
  row: RowComponent = Row,
  selected,
  text,
}: Omit<Props, 'event' | 'urlToBeSelected'>) => (
  <ContainerComponent onClick={onClick} selected={selected}>
    <Link className="w-full" href={href}>
      <RowComponent>
        <IconContainer selected={selected}>
          {isValidElement(icon)
            ? // Need to use any so I don't type _all_ icons with "selected" as optional props
              // Not ideal, but it does the job
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              cloneElement(icon, { selected } as any)
            : icon}
        </IconContainer>
        <ItemText selected={selected} text={text} />
        {rightSection}
      </RowComponent>
    </Link>
  </ContainerComponent>
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
  itemContainer,
  rightSection,
  row,
  text,
  urlToBeSelected = href,
}: ItemLinkProps) {
  const pathname = usePathname()

  const selected =
    typeof urlToBeSelected === 'string'
      ? isSamePathOrUnder(pathname, urlToBeSelected)
      : !!urlToBeSelected.pathname &&
        isSamePathOrUnder(pathname, urlToBeSelected.pathname)

  const props = {
    href,
    icon,
    itemContainer,
    rightSection,
    row,
    selected,
    text,
  }

  return (
    <Suspense fallback={<PageLinkUI {...props} />}>
      <PageLinkImpl event={event} {...props} />
    </Suspense>
  )
}
