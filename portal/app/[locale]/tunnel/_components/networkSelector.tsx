import { ChainLogo } from 'components/chainLogo'
import { CheckMark } from 'components/icons/checkMark'
import { Chevron } from 'components/icons/chevron'
import { Menu } from 'components/menu'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useUmami } from 'hooks/useUmami'
import { type ReactNode, useState } from 'react'
import { type RemoteChain } from 'types/chain'

const Container = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col gap-y-2">{children}</div>
)

const Label = ({ text }: { text: string }) => (
  <span className="text-sm font-medium text-neutral-500">{text}</span>
)

const Network = ({ children }: { children: string }) => (
  <span className="overflow-hidden text-ellipsis text-nowrap">{children}</span>
)

type Props = {
  disabled: boolean
  eventName: 'from network' | 'to network'
  label: string
  networkId: RemoteChain['id']
  networks: RemoteChain[]
  onSelectNetwork: (network: RemoteChain['id']) => void
  readonly?: boolean
}

export const NetworkSelector = function ({
  disabled,
  eventName,
  label,
  networkId,
  networks = [],
  onSelectNetwork,
  readonly,
}: Props) {
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false)
  const { track } = useUmami()

  const closeNetworkMenu = () => setShowNetworkDropdown(false)

  const ref = useOnClickOutside<HTMLButtonElement>(closeNetworkMenu)

  const network = networks.find(n => n.id === networkId)

  if (!network) {
    return null
  }

  const selectNetwork = function ({ id }: RemoteChain) {
    setShowNetworkDropdown(false)
    onSelectNetwork(id)
    track?.(eventName)
  }

  const commonCss = `flex h-8 items-center border border-solid border-neutral-300/55 shadow-soft
    text-sm font-medium text-neutral-950 rounded-lg bg-white py-1.5 px-3 gap-x-2 leading-[18px]`

  if (readonly || networks.length === 1) {
    return (
      <Container>
        <Label text={label} />
        <div className={commonCss}>
          <div className="flex-shrink-0">
            <ChainLogo chainId={networkId} />
          </div>
          <Network>{network.name}</Network>
        </div>
      </Container>
    )
  }

  const chevronCss =
    'ml-auto [&>path]:transition-colors [&>path]:duration-200 [&>path]:group-hover/network-selector:fill-neutral-950'

  return (
    <Container>
      <Label text={label} />
      <button
        className={`${commonCss} group/network-selector relative cursor-pointer transition-colors duration-200 hover:bg-neutral-50`}
        disabled={disabled || networks.length < 2}
        onClick={() => setShowNetworkDropdown(prev => !prev)}
        ref={ref}
        type="button"
      >
        <div className="flex-shrink-0">
          <ChainLogo chainId={networkId} />
        </div>
        <Network>{network.name}</Network>
        {networks.length > 1 &&
          (showNetworkDropdown ? (
            <Chevron.Up className={chevronCss} />
          ) : (
            <Chevron.Bottom className={chevronCss} />
          ))}
        {showNetworkDropdown && (
          <div className="absolute bottom-0 right-0 z-10 translate-y-[calc(100%+5px)]">
            <Menu
              items={networks
                .sort((a, b) =>
                  a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
                )
                .map(n => ({
                  content: (
                    <div
                      className="flex items-center gap-x-2 py-1"
                      onClick={function (e) {
                        e.stopPropagation()
                        selectNetwork(n)
                      }}
                    >
                      <ChainLogo chainId={n.id} />
                      <span className="whitespace-nowrap">{n.name}</span>
                      <div
                        className={networkId === n.id ? 'block' : 'invisible'}
                      >
                        <CheckMark />
                      </div>
                    </div>
                  ),
                  id: n.id.toString(),
                }))}
            />
          </div>
        )}
      </button>
    </Container>
  )
}
