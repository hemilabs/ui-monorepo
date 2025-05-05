import { useUmami } from 'app/analyticsEvents'
import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { useConfig as useBtcConfig } from 'btc-wallet/hooks/useConfig'
import { useDisconnect as useBtcDisconnect } from 'btc-wallet/hooks/useDisconnect'
import { useSwitchChain as useSwitchBtcChain } from 'btc-wallet/hooks/useSwitchChain'
import { type Account } from 'btc-wallet/unisat'
import { Chevron } from 'components/icons/chevron'
import { Menu } from 'components/menu'
import {
  useConnectedToUnsupportedBtcChain,
  useConnectedToUnsupportedEvmChain,
} from 'hooks/useConnectedToUnsupportedChain'
import { useNetworkType } from 'hooks/useNetworkType'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { usePathname } from 'i18n/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { formatBtcAddress, formatEvmAddress } from 'utils/format'
import { type Address } from 'viem'
import { useAccount, useDisconnect as useEvmDisconnect } from 'wagmi'

import { BtcLogo } from '../icons/btcLogo'

import { CopyLogo } from './copyLogo'
import { DisconnectLogo } from './disconnectLogo'
import { EvmChainsMenu } from './evmChainsMenu'
import { EvmLogo } from './evmLogo'
import { WrongEvmNetwork, WrongNetwork } from './wrongNetwork'

const ConnectedChain = function ({
  closeMenu,
  icon,
  menu,
  menuOpen = false,
  name,
  openMenu,
}: {
  closeMenu?: () => void
  icon: React.ReactNode
  menu?: React.ReactNode
  menuOpen?: boolean
  name: string
  openMenu?: () => void
}) {
  const ref = useOnClickOutside<HTMLDivElement>(closeMenu)

  const chevronCss =
    '[&>path]:fill-neutral-500 [&>path]:group-hover/connected-account:fill-neutral-950'

  return (
    <div
      className={`relative flex h-8 items-center gap-x-2 rounded-lg p-2 ${
        openMenu
          ? 'group/connected-account cursor-pointer hover:bg-neutral-100'
          : ''
      }`}
      onClick={openMenu}
      ref={ref}
    >
      <div className="flex cursor-pointer items-center justify-between gap-x-1 rounded-md">
        {icon}
        <span className="mr-2 text-sm font-medium text-neutral-950">
          {name}
        </span>
        {menu !== undefined &&
          (menuOpen ? (
            <Chevron.Up className={chevronCss} />
          ) : (
            <Chevron.Bottom className={chevronCss} />
          ))}
      </div>
      {menuOpen && menu}
    </div>
  )
}

const ConnectedWallet = function ({
  address,
  connectorName,
  copyEvent,
  disconnect,
  formattedAddress,
}: {
  address: Address | Account
  connectorName: string
  copyEvent: 'btc copy' | 'evm copy'
  disconnect: () => void
  formattedAddress: string
}) {
  const [networkType] = useNetworkType()
  const [menuOpen, setMenuOpen] = useState(false)
  const t = useTranslations('connect-wallets')
  const { track } = useUmami()

  const closeMenu = () => setMenuOpen(false)

  const ref = useOnClickOutside<HTMLDivElement>(closeMenu)

  const copyAddress = function () {
    navigator.clipboard.writeText(address)
    track?.(copyEvent, { chain: networkType, wallet: connectorName })
    closeMenu()
  }

  const chevronCss =
    '[&>path]:fill-neutral-500 [&>path]:group-hover/connected-wallet:fill-neutral-950'

  return (
    <div
      className="group/connected-wallet relative flex h-8 cursor-pointer items-center rounded-lg
        p-2 text-sm font-medium text-neutral-950 hover:bg-neutral-100"
      ref={ref}
    >
      <div
        className="flex cursor-pointer items-center justify-between gap-x-1 rounded-md"
        onClick={() => setMenuOpen(prev => !prev)}
      >
        <span className="text-sm">{formattedAddress}</span>
        {menuOpen ? (
          <Chevron.Up className={chevronCss} />
        ) : (
          <Chevron.Bottom className={chevronCss} />
        )}
      </div>
      {menuOpen && (
        <div className="absolute bottom-0 right-0 z-10 translate-x-[calc(100%-20px)] translate-y-[calc(100%-5px)]">
          <Menu
            items={[
              {
                content: (
                  <button
                    className="flex items-center gap-x-1"
                    onClick={copyAddress}
                  >
                    <CopyLogo className="[&>path]:group-hover/menu-item:fill-neutral-950" />
                    <span className="w-max text-sm">{t('copy-address')}</span>
                  </button>
                ),
                id: 'copy',
              },
              {
                content: (
                  <button
                    className="flex items-center gap-x-1"
                    onClick={disconnect}
                  >
                    <DisconnectLogo className="[&>g>path]:group-hover/menu-item:fill-neutral-950" />
                    <span className="text-sm">{t('disconnect')}</span>
                  </button>
                ),
                id: 'disconnect',
              },
            ]}
          />
        </div>
      )}
    </div>
  )
}

export const ConnectedEvmChain = function () {
  const { chain, isConnected } = useAccount()
  const isChainUnsupported = useConnectedToUnsupportedEvmChain()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!isConnected || !pathname.includes('tunnel')) {
    return null
  }

  const closeMenu = () => setMenuOpen(false)

  if (isChainUnsupported) {
    return <WrongEvmNetwork />
  }
  return (
    <ConnectedChain
      closeMenu={closeMenu}
      icon={<EvmLogo chainId={chain.id} />}
      menu={<EvmChainsMenu onSwitchChain={closeMenu} />}
      menuOpen={menuOpen}
      name={chain.name}
      openMenu={() => setMenuOpen(prev => !prev)}
    />
  )
}

export const ConnectedEvmAccount = function () {
  const { address, connector } = useAccount()
  const { disconnect } = useEvmDisconnect()

  return (
    <ConnectedWallet
      address={address}
      connectorName={connector.name}
      copyEvent="evm copy"
      disconnect={disconnect}
      formattedAddress={address ? formatEvmAddress(address) : '...'}
    />
  )
}

export const ConnectedBtcAccount = function () {
  const { address, connector } = useBtcAccount()
  const { disconnect } = useBtcDisconnect()

  return (
    <ConnectedWallet
      address={address}
      connectorName={connector.name}
      copyEvent="btc copy"
      disconnect={disconnect}
      formattedAddress={address ? formatBtcAddress(address) : '...'}
    />
  )
}

export const ConnectedBtcChain = function () {
  const { chains } = useBtcConfig()
  const { chain, isConnected } = useBtcAccount()

  const { switchChain } = useSwitchBtcChain()

  const isChainUnsupported = useConnectedToUnsupportedBtcChain()

  if (!isConnected) {
    return null
  }

  if (isChainUnsupported) {
    // As only one btc chain is supported at the moment, this will work.
    // Once there are multiple chains, we may need to show a dropdown or something
    // to select the chain to connect to.
    const chainId = chains[0].id === chain.id ? chains[1].id : chains[0].id
    return <WrongNetwork onClick={() => switchChain({ chainId })} type="BTC" />
  }
  return <ConnectedChain icon={<BtcLogo />} name={chain.name} />
}
