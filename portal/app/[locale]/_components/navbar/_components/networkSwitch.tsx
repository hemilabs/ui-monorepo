import { CheckMark } from 'components/icons/checkMark'
import { Chevron } from 'components/icons/chevron'
import { NetworkIcon } from 'components/icons/networkIcon'
import { Menu } from 'components/menu'
import {
  networkTypes,
  type NetworkType,
  useNetworkType,
} from 'hooks/useNetworkType'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useUmami } from 'hooks/useUmami'
import { useWindowSize } from 'hooks/useWindowSize'
import { useTranslations } from 'next-intl'
import { useState, Suspense, useRef, ComponentProps } from 'react'
import ReactDOM from 'react-dom'
import { screenBreakpoints } from 'styles'

import { IconContainer as DefaultIconContainer } from './iconContainer'
import { ItemLink } from './itemLink'
import { ItemContainer, ItemText, Row } from './navItem'

type Props = Pick<
  ComponentProps<typeof ItemLink>,
  'iconContainer' | 'itemContainer' | 'row'
>

const SwitchUI = function ({
  iconContainer: IconContainer = DefaultIconContainer,
  network,
  row: RowComponent = Row,
  setIsOpen,
}: Omit<Props, 'itemContainer'> & {
  network: NetworkType
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const t = useTranslations('navbar')

  const getNetworkText = () => network[0].toUpperCase() + network.slice(1)

  return (
    <RowComponent onClick={() => setIsOpen?.(isOpen => !isOpen)}>
      <IconContainer>
        <div className="max-md:size-4 md:w-3">
          <NetworkIcon />
        </div>
      </IconContainer>
      <ItemText text={t('network')} />
      <div className="ml-auto flex items-center gap-x-1">
        <ItemText text={getNetworkText()} />
        <Chevron.Bottom />
      </div>
    </RowComponent>
  )
}

const NetworkSwitchImpl = function ({
  itemContainer: ContainerComponent = ItemContainer,
  ...props
}: Props) {
  const [networkType, setNetworkType] = useNetworkType()
  const [isOpen, setIsOpen] = useState(false)
  const ref = useOnClickOutside<HTMLDivElement>(() => setIsOpen(false))
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const { track } = useUmami()
  const { width } = useWindowSize()

  const selectNetwork = function (type: NetworkType) {
    setNetworkType(type)
    // @ts-expect-error Typescript fails to generate the correct string interpolation
    track?.(`nav - ${type === 'mainnet' ? 'testnet' : 'mainnet'} to ${type}`)
    setIsOpen(false)
  }

  const getDropdownPosition = function () {
    if (!menuContainerRef.current) return { left: 0, top: 0 }

    const rect = menuContainerRef.current.getBoundingClientRect()
    if (width < screenBreakpoints.md) {
      return {
        // this takes the whole width, so this is the only one that needs "right" set.
        left: '1.25rem',
        right: '1.25rem',
        top: rect.top,
      }
    }
    if (width < screenBreakpoints.lg) {
      // menu container is slightly displaced to the right due to the drawer
      return {
        left: '1rem',
        top: rect.top,
      }
    }
    // menu container here is completely to the left
    return {
      left: '0.5rem',
      top: rect.top,
    }
  }

  return (
    <ContainerComponent
      onClick={() => setIsOpen(true)}
      ref={menuContainerRef}
      selected={isOpen}
    >
      <SwitchUI network={networkType} setIsOpen={setIsOpen} {...props} />
      {isOpen &&
        document.body &&
        ReactDOM.createPortal(
          <div
            className="md:w-50 absolute z-40 lg:fixed"
            onMouseDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
            ref={ref}
            style={getDropdownPosition()}
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
                      <div className={selected ? 'block' : 'invisible'}>
                        <CheckMark />
                      </div>
                      <span className="capitalize">{type}</span>
                    </button>
                  ),
                  id: type,
                }
              })}
            />
          </div>,
          document.body,
        )}
    </ContainerComponent>
  )
}

export const NetworkSwitch = ({
  itemContainer: ContainerComponent = ItemContainer,
  ...props
}: Pick<
  ComponentProps<typeof ItemLink>,
  'iconContainer' | 'itemContainer' | 'row'
>) => (
  // The Switch component is the same for mainnet|testnet, when it is closed
  // except for the selected network. This will depend on the networkType query string
  // When omitted, it defaults to mainnet. I expect the majority of the users to want to be on mainnet,
  // so while the component is loading, we show the mainnet switch. For testnet users, until hydration, it may mean
  // that mainnet will briefly appear selected. I'm choosing this trade-off for a better user experience
  // for mainnet users.
  <Suspense
    fallback={
      <ContainerComponent>
        <SwitchUI network="mainnet" {...props} />
      </ContainerComponent>
    }
  >
    <NetworkSwitchImpl itemContainer={ContainerComponent} {...props} />
  </Suspense>
)
