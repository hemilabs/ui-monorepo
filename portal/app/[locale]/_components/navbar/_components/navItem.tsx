import { type AnalyticsEventsWithChain } from 'app/analyticsEvents'
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
import { ComponentProps, RefObject, ReactNode, useState } from 'react'
import { UrlObject } from 'url'

export type NavItemProps = {
  event?: AnalyticsEventsWithChain
  icon?: ReactNode
  rightSection?: ReactNode
  text: string
  urlToBeSelected?: string | UrlObject
}

type Selectable = { selected?: boolean }

export const IconContainer = ({
  children,
  selected = false,
}: Selectable & { children: ReactNode }) => (
  <div
    className={`flex h-6 w-6 items-center justify-center rounded-md
      transition-colors duration-300 md:h-5
      md:w-5 group-hover/nav:[&>svg>path]:fill-neutral-950 ${
        selected
          ? 'bg-orange-500 [&>svg>path]:fill-white'
          : 'bg-neutral-100 [&>svg>path]:fill-neutral-400 group-hover/item:[&>svg>path]:fill-neutral-950'
      }`}
  >
    {children}
  </div>
)

export const Row = (props: { children: ReactNode } & ComponentProps<'div'>) => (
  <div className="flex items-center gap-x-2" {...props} />
)

export const ItemContainer = ({
  children,
  selected = false,
  ...props
}: { children: ReactNode } & Selectable & ComponentProps<'div'>) => (
  <div
    {...props}
    className={`group/item cursor-pointer rounded-md py-2 transition-colors duration-300 ${
      selected ? 'bg-orange-50' : 'hover:bg-neutral-100'
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
    className={`group/nav cursor-pointer rounded-lg py-2 transition-colors duration-300 ${
      isOpen ? 'rounded-lg bg-neutral-100' : 'hover:bg-neutral-100'
    }`}
    ref={refProp}
  >
    {children}
  </div>
)

export const ItemText = ({
  selected = false,
  text,
}: Pick<NavItemProps, 'text'> & Selectable) => (
  <span
    className={`text-base font-medium transition-colors duration-300
       group-hover/nav:text-neutral-950 md:text-sm ${
         selected
           ? 'text-orange-500'
           : 'text-neutral-600 group-hover/item:text-neutral-950'
       }`}
  >
    {text}
  </span>
)

export type ItemLinkProps = NavItemProps &
  Required<Pick<ComponentProps<typeof Link>, 'href'>>

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

  const getNetworkText = (network: string) =>
    network[0].toUpperCase() + network.slice(1)

  return (
    <MenuContainer
      isOpen={isOpen}
      onClick={() => setIsOpen(true)}
      refProp={ref}
    >
      <div>
        <Row onClick={() => setIsOpen(!isOpen)}>
          <IconContainer>
            <NetworkIcon />
          </IconContainer>
          <ItemText text={t('network')} />
          <div className="ml-auto flex items-center gap-x-1">
            <ItemText text={getNetworkText(networkType)} />
            <Chevron.Bottom />
          </div>
        </Row>
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
