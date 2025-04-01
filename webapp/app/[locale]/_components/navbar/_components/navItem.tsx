import { type AnalyticsEventsWithChain } from 'app/analyticsEvents'
import { ExternalLink as AnchorTag } from 'components/externalLink'
import { ArrowDownLeftIcon } from 'components/icons/arrowDownLeftIcon'
import { CheckMark } from 'components/icons/checkMark'
import { Chevron } from 'components/icons/chevron'
import { NetworkIcon } from 'components/icons/networkIcon'
import { Link } from 'components/link'
import { Menu } from 'components/menu'
import {
  networkTypes,
  type NetworkType,
  useNetworkType,
} from 'hooks/useNetworkType'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useUmami } from 'hooks/useUmami'
import { usePathname } from 'i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { ComponentProps, RefObject, ReactNode, useState } from 'react'
import { UrlObject } from 'url'
import { isRelativeUrl } from 'utils/url'

type Props = {
  event?: AnalyticsEventsWithChain
  icon?: ReactNode
  rightSection?: ReactNode
  text: string
  urlToBeSelected?: string | UrlObject
}

type Selectable = { selected?: boolean }

const IconContainer = ({
  children,
  selected = false,
}: Selectable & { children: ReactNode }) => (
  <div
    className={`flex h-6 w-6 items-center justify-center rounded-[4px] 
    border py-1 shadow-md md:h-5 md:w-5 ${
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
    className={`group/item cursor-pointer rounded-lg py-2 transition-colors duration-300 ${
      selected
        ? 'border border-orange-500/55 bg-orange-50'
        : 'border border-transparent hover:bg-neutral-100'
    }`}
  >
    {children}
  </div>
)

const MenuContainer = ({
  children,
  isOpen,
  refProp,
  ...props
}: { children: ReactNode } & {
  isOpen: boolean
  refProp: RefObject<HTMLDivElement>
} & ComponentProps<'div'>) => (
  <div
    {...props}
    className={`cursor-pointer rounded-lg py-2 transition-colors duration-300 ${
      isOpen ? 'rounded-lg bg-neutral-100' : 'hover:bg-neutral-100'
    }`}
    ref={refProp}
  >
    {children}
  </div>
)

const ItemText = ({
  selected = false,
  text,
}: Pick<Props, 'text'> & Selectable) => (
  <span
    className={`text-base font-medium capitalize transition-colors duration-300
      group-hover/item:text-neutral-950 md:text-sm ${
        selected ? 'text-neutral-950' : 'text-neutral-600'
      }`}
  >
    {text}
  </span>
)

type ItemLinkProps = Props & Required<Pick<ComponentProps<typeof Link>, 'href'>>

const ExternalLink = function ({
  event,
  href,
  icon,
  text,
}: Omit<ItemLinkProps, 'href'> & Pick<ComponentProps<'a'>, 'href'>) {
  const [networkType] = useNetworkType()
  const { track } = useUmami()
  const addTracking = () =>
    track ? () => track(event, { chain: networkType }) : undefined
  return (
    <ItemContainer>
      <AnchorTag href={href} onClick={addTracking()}>
        <Row>
          {icon && <IconContainer>{icon}</IconContainer>}
          <ItemText text={text} />
          <ArrowDownLeftIcon className="ml-auto" />
        </Row>
      </AnchorTag>
    </ItemContainer>
  )
}

const PageLink = function ({
  event,
  href,
  icon,
  rightSection,
  text,
  urlToBeSelected = href,
}: ItemLinkProps) {
  const locale = useLocale()
  const [networkType] = useNetworkType()
  const pathname = usePathname()
  const { track } = useUmami()

  const selected =
    typeof urlToBeSelected === 'string'
      ? pathname.startsWith(`/${locale}${urlToBeSelected}`)
      : pathname.startsWith(`/${locale}${urlToBeSelected.pathname}`)

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

export const ItemLink = (props: ItemLinkProps) =>
  typeof props.href === 'string' && !isRelativeUrl(props.href) ? (
    // @ts-expect-error Typescript fails to detect that props.href must be a string
    <ExternalLink {...props} />
  ) : (
    <PageLink {...props} />
  )

export const ItemWithSubmenu = function ({
  event,
  icon,
  subMenu,
  text,
}: Props & { subMenu: ReactNode }) {
  const [networkType] = useNetworkType()
  const [isOpen, setIsOpen] = useState(false)
  const { track } = useUmami()

  const ref = useOnClickOutside<HTMLDivElement>(() => setIsOpen(false))

  const onClick = function () {
    setIsOpen(!isOpen)
    track?.(event, { chain: networkType })
  }

  return (
    <MenuContainer isOpen={isOpen} refProp={ref}>
      <Row onClick={onClick}>
        <IconContainer>{icon}</IconContainer>
        <ItemText selected={isOpen} text={text} />
        {isOpen ? (
          <Chevron.Up className="-mr-1 ml-auto" />
        ) : (
          <Chevron.Bottom className="-mr-1 ml-auto" />
        )}
      </Row>
      {isOpen && <ul className="mt-2 flex flex-col">{subMenu}</ul>}
    </MenuContainer>
  )
}

export const NetworkSwitch = function () {
  const [networkType, setNetworkType] = useNetworkType()
  const [isOpen, setIsOpen] = useState(false)
  const ref = useOnClickOutside<HTMLDivElement>(() => setIsOpen(false))
  const { track } = useUmami()
  const t = useTranslations('navbar')

  const selectNetwork = function (type: NetworkType) {
    setNetworkType(type)
    // @ts-expect-error Typescript fails to generate the correct string interpolation
    track?.(`nav - ${type === 'mainnet' ? 'testnet' : 'mainnet'} to ${type}`)
    setIsOpen(false)
  }

  return (
    <MenuContainer
      isOpen={isOpen}
      onClick={() => setIsOpen(true)}
      refProp={ref}
    >
      <div className="relative">
        <Row onClick={() => setIsOpen(!isOpen)}>
          <IconContainer>
            <NetworkIcon />
          </IconContainer>
          <ItemText text={t('network')} />
          <div className="ml-auto flex items-center gap-x-1">
            <ItemText selected={isOpen} text={networkType} />
            <Chevron.Bottom />
          </div>
        </Row>
        {isOpen && (
          <div className="absolute right-0 top-0 z-20 -translate-y-full translate-x-3">
            <Menu
              items={networkTypes.map(function (type) {
                const selected = type === networkType
                return {
                  content: (
                    <button
                      className={`flex items-center gap-x-2 ${
                        selected ? 'text-neutral-950' : ''
                      }`}
                      disabled={selected}
                      key={type}
                      onClick={function (e) {
                        e.stopPropagation()
                        selectNetwork(type)
                      }}
                    >
                      <span className="capitalize">{type}</span>
                      <div className={selected ? 'block' : 'invisible'}>
                        <CheckMark className="[&>path]:stroke-emerald-500" />
                      </div>
                    </button>
                  ),
                  id: type,
                }
              })}
            />
          </div>
        )}
      </div>
    </MenuContainer>
  )
}
