'use client'

import { ChainLogo } from 'components/chainLogo'
import { CheckMark } from 'components/icons/checkMark'
import { Chevron } from 'components/icons/chevron'
import { useState } from 'react'
import { type RemoteChain } from 'types/chain'
import { useOnClickOutside } from 'ui-common/hooks/useOnClickOutside'

import { Menu } from './menu'

type Props = {
  disabled: boolean
  networkId: RemoteChain['id'] | undefined
  networks: RemoteChain[]
  onSelectNetwork: (network: RemoteChain['id']) => void
  readonly?: boolean
}

export const NetworkSelector = function ({
  disabled,
  networkId,
  networks = [],
  onSelectNetwork,
  readonly,
}: Props) {
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false)

  const closeNetworkMenu = () => setShowNetworkDropdown(false)

  const ref = useOnClickOutside<HTMLButtonElement>(closeNetworkMenu)

  const network = networks.find(n => n.id === networkId)

  if (!network) {
    return null
  }

  const selectNetwork = function ({ id }: RemoteChain) {
    setShowNetworkDropdown(false)
    onSelectNetwork(id)
  }

  const commonCss = 'flex items-center rounded-xl bg-zinc-50 p-2 gap-x-2'

  if (readonly || networks.length === 1) {
    return (
      <div className={commonCss}>
        <ChainLogo chainId={networkId} />
        <span className="font-medium">{network.name}</span>
      </div>
    )
  }
  return (
    <>
      <button
        className={`${commonCss} relative cursor-pointer`}
        disabled={disabled || networks.length < 2}
        onClick={() => setShowNetworkDropdown(true)}
        ref={ref}
        type="button"
      >
        <ChainLogo chainId={networkId} />
        <span>{network.name}</span>
        {networks.length > 1 && <Chevron.Bottom />}
        {showNetworkDropdown && (
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
                    <div className={networkId === n.id ? 'block' : 'invisible'}>
                      <CheckMark />
                    </div>
                  </div>
                ),
                id: n.id.toString(),
              }))}
          />
        )}
      </button>
    </>
  )
}
