import { useUmami } from 'app/analyticsEvents'
import { Link } from 'components/link'
import { useNetworkType } from 'hooks/useNetworkType'
import { usePathnameWithoutLocale } from 'hooks/usePathnameWithoutLocale'

import {
  IconContainer,
  ItemContainer,
  ItemLinkProps,
  ItemText,
  Row,
} from './navItem'

export const PageLink = function ({
  event,
  href,
  icon,
  rightSection,
  text,
  urlToBeSelected = href,
}: ItemLinkProps) {
  const [networkType] = useNetworkType()
  const pathname = usePathnameWithoutLocale()
  const { track } = useUmami()

  const selected =
    typeof urlToBeSelected === 'string'
      ? pathname.startsWith(urlToBeSelected)
      : pathname.startsWith(urlToBeSelected.pathname)

  return (
    <ItemContainer
      onClick={
        track && !!event
          ? () => track(event, { chain: networkType })
          : undefined
      }
      selected={selected}
    >
      <Link href={href}>
        <Row>
          <IconContainer selected={selected}>{icon}</IconContainer>
          <ItemText selected={selected} text={text} />
          {rightSection}
        </Row>
      </Link>
    </ItemContainer>
  )
}
