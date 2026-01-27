import { bitcoinMainnet, bitcoinTestnet } from 'btc-wallet/chains'
import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { useSwitchChain as useSwitchBtcChain } from 'btc-wallet/hooks/useSwitchChain'
import { type Account } from 'btc-wallet/unisat'
import { BtcWalletLogo } from 'components/connectWallets/btcWalletLogo'
import { EvmWalletLogo } from 'components/connectWallets/evmWalletLogo'
import { ProfileIcon } from 'components/connectWallets/icons/profile'
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
import { useAccount } from 'wagmi'

import { BtcLogo } from '../icons/btcLogo'

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
  closeMenu?: VoidFunction
  icon: ReactNode
  menu?: ReactNode
  menuOpen?: boolean
  name: string
  openMenu?: VoidFunction
}) {
  const ref = useOnClickOutside<HTMLDivElement>(closeMenu)
  const [networkType] = useNetworkType()
  const isMainnet = networkType === 'mainnet'

  const chevronCss =
    '[&>path]:fill-neutral-500 [&>path]:group-hover/connected-account:fill-neutral-950 [&>path]:transition-colors [&>path]:duration-200'

  return (
    <div className="flex items-center gap-3 px-2">
      <div
        className={`${
          isMainnet ? 'w-32' : 'w-37'
        } relative flex h-7 items-center gap-x-2 rounded-md px-2 py-1.5 shadow-sm transition-colors duration-200 hover:bg-neutral-50 ${
          openMenu ? 'group/connected-account cursor-pointer' : ''
        }`}
        onClick={openMenu}
        ref={ref}
      >
        <div className="flex w-full cursor-pointer items-center justify-between gap-x-2 rounded-md">
          <div className="flex items-center gap-x-1">
            {icon}
            <span className="text-sm font-medium text-neutral-950">{name}</span>
          </div>
          {menu !== undefined &&
            (menuOpen ? (
              <Chevron.Up className={chevronCss} />
            ) : (
              <Chevron.Bottom className={chevronCss} />
            ))}
        </div>
        {menuOpen && menu}
      </div>
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
  const [copied, setCopied] = useState(false)

  const copyAddress = function () {
    // if this function is called, the user is connected and therefore it is defined
    // as well as the connector
    navigator.clipboard.writeText(address!)
    track?.(copyEvent, { wallet: connectorName! })

    // This is to control the tooltip visibility
    // When the address is copied, we need to keep the tooltip visible for a few seconds
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="group/connected-wallet relative flex h-8 items-center rounded-lg
        py-2 text-sm font-medium text-neutral-950"
    >
      <div className="flex items-center gap-3">
        <div className="relative size-8">
          <ProfileIcon />
          {connectorName && (
            <div className="absolute -bottom-1.5 -right-1.5 rounded-full bg-neutral-100 p-0.5">
              {connectorLogo}
            </div>
          )}
        </div>

        <Tooltip
          borderRadius="6px"
          id="copy-address"
          text={copied ? t('copied') : t('copy')}
          trigger={copied ? [] : ['hover']}
          variant="simple"
          visible={copied ? true : undefined}
        >
          <span
            className="cursor-pointer text-sm"
            onClick={address ? copyAddress : undefined}
          >
            {formattedAddress}
          </span>
        </Tooltip>
      </div>
    </div>
  )
}

export const ConnectedEvmChain = function () {
  const { chain, isConnected } = useAccount()
  const isChainUnsupported = useConnectedToUnsupportedEvmChain()
  const [menuOpen, setMenuOpen] = useState(false)

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
      connectorLogo={
        <BtcWalletLogo className="size-4" walletId={connector?.id} />
      }
      connectorName={connector?.name}
      copyEvent="btc copy"
      formattedAddress={address ? formatBtcAddress(address) : '...'}
    />
  )
}

export const ConnectedBtcChain = function () {
  const { chain, connector, isConnected } = useBtcAccount()
  const [networkType] = useNetworkType()

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
        onClick={
          connector?.supportsSwitchNetwork
            ? () => switchChain({ chainId: btcChain.id })
            : undefined
        }
        type="BTC"
      />
    )
  }
  return <ConnectedChain icon={<BtcLogo />} name={chain.name} />
}
