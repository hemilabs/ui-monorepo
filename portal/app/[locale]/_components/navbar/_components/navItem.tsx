import { type AnalyticsEvent } from 'app/analyticsEvents'
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
import { useTranslations } from 'next-intl'
import {
  ComponentProps,
  ReactNode,
  useState,
  Suspense,
  ComponentType,
} from 'react'
import { UrlObject } from 'url'

import { IconContainer } from './iconContainer'

type Selectable = { selected?: boolean }

export type NavItemProps = {
  event?: AnalyticsEvent
  icon?: ReactNode
  iconContainer?: ComponentType<ComponentProps<typeof IconContainer>>
  itemContainer?: ComponentType<ComponentProps<'div'> & Selectable>
  rightSection?: ReactNode
  row?: ComponentType<ComponentProps<'div'>>
  text: string
  urlToBeSelected?: string | UrlObject
}

export const Row = (props: ComponentProps<'div'>) => (
  <div
    className="flex w-full flex-col items-center gap-2 md:flex-row"
    {...props}
  />
)

export const ItemContainer = ({
  children,
  justifyItems = 'justify-center md:justify-start',
  padding = 'py-1.5',
  selected = false,
  ...props
}: Selectable &
  ComponentProps<'div'> & { justifyItems?: string; padding?: string }) => (
  <div
    {...props}
    className={`group/item flex ${justifyItems} h-full cursor-pointer items-center rounded-lg ${padding} transition-colors duration-300 md:rounded-md ${
      selected ? 'bg-orange-50' : 'hover:bg-neutral-100 max-md:bg-zinc-50/80'
    }`}
  >
    {children}
  </div>
)

const MenuContainer = ({
  children,
  isOpen = false,
  ref,
  ...props
}: ComponentProps<'div'> & {
  isOpen?: boolean
}) => (
  <div
    {...props}
    className={`group/nav cursor-pointer rounded-lg py-2 transition-colors duration-300 ${
      isOpen ? 'rounded-lg bg-neutral-100' : 'hover:bg-neutral-100'
    }`}
    ref={ref}
  >
    {children}
  </div>
)

export const ItemText = ({
  selected = false,
  text,
}: Pick<NavItemProps, 'text'> & Selectable) => (
  <span
    className={`text-sm font-semibold transition-colors duration-300
       group-hover/nav:text-neutral-950 md:font-medium ${
         selected
           ? 'text-orange-600'
           : 'text-neutral-600 group-hover/item:text-neutral-950'
       }`}
  >
    {text}
  </span>
)

export type ItemLinkProps = NavItemProps &
  Required<Pick<ComponentProps<typeof Link>, 'href'>>

export type ItemAccordionProps = {
  icon: ReactNode
  items: Omit<ItemLinkProps, 'icon' | 'rightSection'>[]
  text: string
}

export const AccordionContainer = ({
  children,
  isOpen = false,
  ...props
}: { children: ReactNode } & {
  isOpen?: boolean
} & ComponentProps<'div'>) => (
  <div
    {...props}
    className={`group/nav cursor-pointer rounded-lg p-2 transition-colors duration-300 ${
      isOpen ? 'rounded-lg bg-neutral-100' : 'hover:bg-neutral-100'
    }`}
  >
    {children}
  </div>
)

export const AccordionIconContainer = ({
  children,
  selected = false,
}: Selectable & { children: ReactNode }) => (
  <div
    className={`flex size-6 items-center justify-center rounded-md
      transition-colors duration-300 md:size-5
      group-hover/nav:[&>svg>path]:fill-neutral-950 ${
        selected
          ? '[&>svg>path]:fill-neutral-950'
          : 'bg-neutral-100 [&>svg>path]:fill-neutral-400'
      }`}
  >
    {children}
  </div>
)

export const AccordionItemText = ({
  selected = false,
  text,
}: Pick<NavItemProps, 'text'> & Selectable) => (
  <span
    className={`text-base font-medium transition-colors duration-300
       group-hover/nav:text-neutral-950 md:text-sm ${
         selected
           ? 'text-neutral-950'
           : 'text-neutral-600 group-hover/item:text-neutral-950'
       }`}
  >
    {text}
  </span>
)

const SwitchUI = function ({
  network,
  setIsOpen,
}: {
  network: NetworkType
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const t = useTranslations('navbar')

  const getNetworkText = () => network[0].toUpperCase() + network.slice(1)

  return (
    <Row onClick={() => setIsOpen?.(isOpen => !isOpen)}>
      <IconContainer>
        <NetworkIcon />
      </IconContainer>
      <ItemText text={t('network')} />
      <div className="ml-auto flex items-center gap-x-1">
        <ItemText text={getNetworkText()} />
        <Chevron.Bottom />
      </div>
    </Row>
  )
}

const NetworkSwitchImpl = function () {
  const [networkType, setNetworkType] = useNetworkType()
  const [isOpen, setIsOpen] = useState(false)
  const ref = useOnClickOutside<HTMLDivElement>(() => setIsOpen(false))
  const { track } = useUmami()

  const selectNetwork = function (type: NetworkType) {
    setNetworkType(type)
    // @ts-expect-error Typescript fails to generate the correct string interpolation
    track?.(`nav - ${type === 'mainnet' ? 'testnet' : 'mainnet'} to ${type}`)
    setIsOpen(false)
  }

  return (
    <MenuContainer isOpen={isOpen} onClick={() => setIsOpen(true)} ref={ref}>
      <div>
        <SwitchUI network={networkType} setIsOpen={setIsOpen} />
        {isOpen && (
          <div
            className="-translate-y-26 md:translate-x-34 absolute right-0 z-20
            -translate-x-3 md:left-0 md:w-24"
          >
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

export const NetworkSwitch = () => (
  // The Switch component is the same for mainnet|testnet, when it is closed
  // except for the selected network. This will depend on the networkType query string
  // When omitted, it defaults to mainnet. I expect the majority of the users to want to be on mainnet,
  // so while the component is loading, we show the mainnet switch. For testnet users, until hydration, it may mean
  // that mainnet will briefly appear selected. I'm choosing this trade-off for a better user experience
  // for mainnet users.
  <Suspense
    fallback={
      <MenuContainer>
        <SwitchUI network="mainnet" />
      </MenuContainer>
    }
  >
    <NetworkSwitchImpl />
  </Suspense>
)
