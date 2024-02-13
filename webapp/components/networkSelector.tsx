'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useOnClickOutside } from 'ui-common/hooks/useOnClickOutside'
import { Chain } from 'wagmi'

type Props = {
  networkId: Chain['id'] | undefined
  networks: Chain[]
  onSelectNetwork: (network: Chain['id']) => void
  readonly?: boolean
}

export const NetworkSelector = function ({
  networkId,
  networks = [],
  onSelectNetwork,
  readonly,
}: Props) {
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false)
  const dropdownRef = useOnClickOutside<HTMLDivElement>(() =>
    setShowNetworkDropdown(false),
  )

  const t = useTranslations('common')

  const network = networks.find(n => n.id === networkId)

  if (!network) {
    return null
  }

  const selectNetwork = function ({ id }: Chain) {
    setShowNetworkDropdown(false)
    onSelectNetwork(id)
  }

  // TODO update with image from network
  const Logo = () => <div className="bg-bvm-gradient h-6 w-6 rounded-full" />

  const commonCss = 'flex items-center rounded-xl bg-zinc-50 p-2 gap-x-2'

  if (readonly || networks.length === 1) {
    return (
      <div className={commonCss}>
        <Logo />
        <span>{network.name}</span>
      </div>
    )
  }
  return (
    <>
      <button
        className={`${commonCss} relative cursor-pointer`}
        onClick={() => setShowNetworkDropdown(true)}
        type="button"
      >
        <Logo />
        <span>{network.name}</span>
        <svg
          fill="none"
          height="16"
          viewBox="0 0 17 16"
          width="17"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            clipRule="evenodd"
            d="M4.78061 4.32695C4.34467 3.89102 3.63788 3.89102 3.20195 4.32695C2.76602 4.76288 2.76602 5.46967 3.20195 5.90561L8.08567 10.7893C8.52161 11.2253 9.22839 11.2253 9.66433 10.7893L14.548 5.90561C14.984 5.46967 14.984 4.76288 14.548 4.32695C14.1121 3.89102 13.4053 3.89102 12.9694 4.32695L8.875 8.42134L4.78061 4.32695Z"
            fill="#1A1C20"
            fillRule="evenodd"
          />
        </svg>
        {showNetworkDropdown && (
          <div
            className="absolute bottom-0 right-0 flex w-48 translate-y-full flex-col rounded-xl bg-white py-3 shadow-2xl"
            ref={dropdownRef}
          >
            <h5 className="w-full px-6 py-1 text-left">
              {t('select-network')}
            </h5>
            <ul>
              {networks
                .filter(n => n.id !== networkId)
                .sort((a, b) =>
                  a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
                )
                .map(n => (
                  <li
                    className="cursor-pointer px-6 hover:bg-slate-100"
                    key={n.id}
                    onClick={function (e) {
                      e.stopPropagation()
                      selectNetwork(n)
                    }}
                  >
                    <div className="flex items-center gap-x-2 py-1">
                      <Logo />
                      <span>{n.name}</span>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </button>
    </>
  )
}
