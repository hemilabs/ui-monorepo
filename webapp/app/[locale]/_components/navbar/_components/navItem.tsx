import { ExternalLink as AnchorTag } from 'components/externalLink'
import { ArrowDownLeftIcon } from 'components/icons/arrowDownLeftIcon'
import { Chevron } from 'components/icons/chevron'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import Link from 'next-intl/link'
import { ComponentProps, ReactNode, useState } from 'react'
import { useOnClickOutside } from 'ui-common/hooks/useOnClickOutside'
import { isRelativeUrl } from 'utils/url'

type Props = {
  icon?: ReactNode
  rightSection?: ReactNode
  text: string
}

type Selectable = { selected?: boolean }

const IconContainer = ({
  children,
  selected = false,
}: Selectable & { children: ReactNode }) => (
  <div
    className={`flex h-5 w-5 items-center 
    justify-center rounded-[4px] border py-1 shadow-md ${
      selected
        ? 'border-orange-700/55 bg-orange-500 [&>svg>path]:fill-white'
        : 'border-neutral-300/55 bg-stone-50'
    }`}
  >
    {children}
  </div>
)

const Row = (props: { children: ReactNode } & ComponentProps<'div'>) => (
  <div className="flex items-center gap-x-2" {...props} />
)

const ItemContainer = ({
  children,
  selected = false,
  ...props
}: { children: ReactNode } & Selectable & ComponentProps<'div'>) => (
  <div
    {...props}
    className={`cursor-pointer rounded-lg py-2 transition-colors duration-300 ${
      selected
        ? 'border border-orange-500/55 bg-orange-50'
        : 'hover:bg-neutral-200'
    }`}
  >
    {children}
  </div>
)

const ItemText = ({
  selected = false,
  text,
}: Pick<Props, 'text'> & Selectable) => (
  <span
    className={`text-xs font-medium text-neutral-600 transition-colors duration-300 hover:text-neutral-950 md:text-sm ${
      selected ? 'text-neutral-950' : 'text-neutral-600'
    }`}
  >
    {text}
  </span>
)

type ItemLinkProps = Props & Required<Pick<ComponentProps<'a'>, 'href'>>

const ExternalLink = ({ href, icon, text }: ItemLinkProps) => (
  <ItemContainer>
    <AnchorTag href={href}>
      <Row>
        {icon && <IconContainer>{icon}</IconContainer>}
        <ItemText text={text} />
        <ArrowDownLeftIcon className="ml-auto" />
      </Row>
    </AnchorTag>
  </ItemContainer>
)

const PageLink = function ({ href, icon, rightSection, text }: ItemLinkProps) {
  const locale = useLocale()
  const pathname = usePathname()
  const selected = pathname.startsWith(`/${locale}${href}`)
  return (
    <ItemContainer selected={selected}>
      <Link href={href}>
        <Row>
          <IconContainer selected={selected}>{icon}</IconContainer>
          <ItemText text={text} />
          {rightSection}
        </Row>
      </Link>
    </ItemContainer>
  )
}

export const ItemLink = (props: ItemLinkProps) =>
  isRelativeUrl(props.href) ? (
    <PageLink {...props} />
  ) : (
    <ExternalLink {...props} />
  )

export const ItemWithSubmenu = function ({
  icon,
  subMenu,
  text,
}: Props & { subMenu: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const ref = useOnClickOutside<HTMLDivElement>()

  return (
    <ItemContainer>
      <div
        className={isOpen ? 'rounded-lg hover:bg-neutral-200' : undefined}
        ref={ref}
      >
        <Row onClick={() => setIsOpen(!isOpen)}>
          <IconContainer>{icon}</IconContainer>
          <ItemText text={text} />
          {isOpen ? (
            <Chevron.Up className="-mr-1 ml-auto" />
          ) : (
            <Chevron.Bottom className="-mr-1 ml-auto" />
          )}
        </Row>
      </div>
      {isOpen && subMenu}
    </ItemContainer>
  )
}
