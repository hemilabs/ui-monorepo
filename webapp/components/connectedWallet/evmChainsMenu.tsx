import { CheckMark } from 'components/icons/checkMark'
import { Menu } from 'components/menu'
import { useNetworks } from 'hooks/useNetworks'
import { useLayoutEffect, useRef, useState } from 'react'
import { useAccount, useSwitchChain as useSwitchEvmChain } from 'wagmi'

import { EvmLogo } from './evmLogo'

export const EvmChainsMenu = function ({
  onSwitchChain,
}: {
  onSwitchChain: () => void
}) {
  const { chainId } = useAccount()
  const { evmNetworks } = useNetworks()
  const { switchChain } = useSwitchEvmChain()

  const menuContainerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ bottom: 0 })

  useLayoutEffect(
    function preventMenuOverflow() {
      const adjustPosition = function () {
        if (!menuContainerRef.current) {
          return
        }
        const rect = menuContainerRef.current.getBoundingClientRect()
        const newPosition = { bottom: 0 }

        if (rect.bottom > window.innerHeight) {
          // Container is using h-8, which is 32px. And each chain is 32px.
          // If we overflow the bottom container (only scenario possible, due to location of the component)
          // we want to move "up" the size of the menu (which is N chains * 32px) + the size of the button that opens the menu (32px)
          newPosition.bottom = 32 + evmNetworks.length * 32
        }

        setPosition(newPosition)
      }

      adjustPosition()
      window.addEventListener('resize', adjustPosition)

      return () => window.removeEventListener('resize', adjustPosition)
    },
    [evmNetworks.length, menuContainerRef, setPosition],
  )

  return (
    <div
      className="absolute bottom-0 right-0 z-20 translate-y-[calc(100%-5px)]"
      ref={menuContainerRef}
      style={{ bottom: position.bottom }}
    >
      <Menu
        items={evmNetworks.map(c => ({
          content: (
            <button
              className="flex items-center gap-x-2"
              disabled={chainId === c.id}
              onClick={function (e) {
                e.stopPropagation()
                switchChain({ chainId: c.id })
                onSwitchChain()
              }}
            >
              <EvmLogo chainId={c.id} />
              <span className="whitespace-nowrap">{c.name}</span>
              <div className={chainId === c.id ? 'block' : 'invisible'}>
                <CheckMark />
              </div>
            </button>
          ),
          id: c.id.toString(),
        }))}
      />
    </div>
  )
}
