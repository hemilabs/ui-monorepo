import { bitcoinMainnet, bitcoinTestnet } from 'btc-wallet/chains'
import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { useDisconnect as useBtcDisconnect } from 'btc-wallet/hooks/useDisconnect'
import { useSwitchChain as useSwitchBtcChain } from 'btc-wallet/hooks/useSwitchChain'
import { type Account } from 'btc-wallet/unisat'
import { Button } from 'components/button'
import { EvmWalletLogo } from 'components/connectWallets/evmWalletLogo'
import { ProfileIcon } from 'components/connectWallets/icons/profile'
import { UnisatLogo } from 'components/connectWallets/unisatLogo'
import { Chevron } from 'components/icons/chevron'
import { Tooltip } from 'components/tooltip'
import {
  useConnectedToUnsupportedBtcChain,
  useConnectedToUnsupportedEvmChain,
} from 'hooks/useConnectedToUnsupportedChain'
import { useNetworkType } from 'hooks/useNetworkType'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'
import { ReactNode, useState } from 'react'
import { formatBtcAddress, formatEvmAddress } from 'utils/format'
import { type Address } from 'viem'
import { useAccount, useDisconnect as useEvmDisconnect } from 'wagmi'

import { BtcLogo } from '../icons/btcLogo'

import { DisconnectLogo } from './disconnectLogo'
import { EvmChainsMenu } from './evmChainsMenu'
import { EvmLogo } from './evmLogo'
import { WrongEvmNetwork, WrongNetwork } from './wrongNetwork'

const ConnectedChain = function ({
  closeMenu,
  disconnect,
  icon,
  menu,
  menuOpen = false,
  name,
  openMenu,
}: {
  closeMenu?: VoidFunction
  disconnect: VoidFunction
  icon: ReactNode
  menu?: ReactNode
  menuOpen?: boolean
  name: string
  openMenu?: VoidFunction
}) {
  const ref = useOnClickOutside<HTMLDivElement>(closeMenu)

  const chevronCss =
    '[&>path]:fill-neutral-500 [&>path]:group-hover/connected-account:fill-neutral-950'

  return (
    <div className="flex items-center gap-3 px-2">
      <div
        className={`relative flex h-7 items-center gap-x-2 rounded-md px-2 py-1.5 shadow-sm  ${
          openMenu ? 'group/connected-account cursor-pointer' : ''
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
      <Button onClick={disconnect} size="xSmall" variant="secondary">
        <DisconnectLogo />
      </Button>
    </div>
  )
}

const ConnectedWallet = function ({
  address,
  connectorLogo,
  connectorName,
  copyEvent,
  formattedAddress,
}: {
  address: Address | Account | undefined
  connectorLogo: ReactNode | undefined
  connectorName: string | undefined
  copyEvent: 'btc copy' | 'evm copy'
  formattedAddress: string
}) {
  const t = useTranslations('common')
  const { track } = useUmami()

  const copyAddress = function () {
    // if this function is called, the user is connected and therefore it is defined
    // as well as the connector
    navigator.clipboard.writeText(address!)
    track?.(copyEvent, { wallet: connectorName! })
  }

  return (
    <div
      className="group/connected-wallet relative flex h-8 cursor-pointer items-center rounded-lg
        p-2 text-sm font-medium text-neutral-950"
    >
      <Tooltip
        borderRadius="6px"
        id="copy-address"
        text={t('copy')}
        variant="simple"
      >
        <div className="flex cursor-pointer items-center gap-3">
          <div className="relative size-8">
            <ProfileIcon />
            {connectorName && (
              <div className="absolute -bottom-1.5 -right-1.5 rounded-full bg-neutral-100 p-0.5">
                {connectorLogo}
              </div>
            )}
          </div>
          <span className="text-sm" onClick={address ? copyAddress : undefined}>
            {formattedAddress}
          </span>
        </div>
      </Tooltip>
    </div>
  )
}

export const ConnectedEvmChain = function () {
  const { chain, isConnected } = useAccount()
  const isChainUnsupported = useConnectedToUnsupportedEvmChain()
  const [menuOpen, setMenuOpen] = useState(false)
  const { disconnect } = useEvmDisconnect()

  if (!isConnected) {
    return null
  }

  const closeMenu = () => setMenuOpen(false)

  if (isChainUnsupported || !chain) {
    return <WrongEvmNetwork />
  }
  return (
    <ConnectedChain
      closeMenu={closeMenu}
      disconnect={disconnect}
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

  return (
    <ConnectedWallet
      address={address}
      connectorLogo={
        <EvmWalletLogo className="size-4" walletName={connector?.name} />
      }
      connectorName={connector?.name}
      copyEvent="evm copy"
      formattedAddress={address ? formatEvmAddress(address) : '...'}
    />
  )
}

export const ConnectedBtcAccount = function () {
  const { address, connector } = useBtcAccount()

  return (
    <ConnectedWallet
      address={address}
      connectorLogo={<UnisatLogo className="size-4" />}
      connectorName={connector?.name}
      copyEvent="btc copy"
      formattedAddress={address ? formatBtcAddress(address) : '...'}
    />
  )
}

export const ConnectedBtcChain = function () {
  const { chain, isConnected } = useBtcAccount()
  const [networkType] = useNetworkType()
  const { disconnect } = useBtcDisconnect()

  const { switchChain } = useSwitchBtcChain()

  const isChainUnsupported = useConnectedToUnsupportedBtcChain()

  if (!isConnected) {
    return null
  }

  if (isChainUnsupported || !chain) {
    // As only one btc chain is supported at the moment, this will work.
    // Once there are multiple chains, we may need to show a dropdown or something
    // to select the chain to connect to.
    const btcChain = networkType === 'mainnet' ? bitcoinMainnet : bitcoinTestnet
    return (
      <WrongNetwork
        onClick={() => switchChain({ chainId: btcChain.id })}
        type="BTC"
      />
    )
  }
  return (
    <ConnectedChain
      disconnect={disconnect}
      icon={<BtcLogo />}
      name={chain.name}
    />
  )
}
