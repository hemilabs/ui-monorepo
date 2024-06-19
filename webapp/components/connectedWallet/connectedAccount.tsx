import { bitcoin } from 'app/networks'
import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { useBalance as useBtcBalance } from 'btc-wallet/hooks/useBalance'
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
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useOnClickOutside } from 'ui-common/hooks/useOnClickOutside'
import {
  formatBtcAddress,
  formatEvmAddress,
  getFormattedValue,
} from 'utils/format'
import { Address, formatUnits } from 'viem'
import {
  useAccount,
  useBalance,
  useDisconnect as useEvmDisconnect,
} from 'wagmi'

import { BtcLogo } from './btcLogo'
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

  return (
    <div className="relative" ref={ref}>
      <div
        className={`flex h-10 w-fit items-center gap-x-2 rounded-md bg-neutral-200/30 p-2 ${
          openMenu ? 'cursor-pointer' : ''
        }`}
        onClick={openMenu}
      >
        {icon}
        <span className="min-w-24">{name}</span>
        {menu !== undefined && <Chevron.Bottom />}
      </div>
      {menuOpen && menu}
    </div>
  )
}

const ConnectedWallet = function ({
  address,
  balance,
  disconnect,
  formattedAddress,
}: {
  address: Address | Account
  balance: string
  disconnect: () => void
  formattedAddress: string
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const t = useTranslations('connect-wallets')

  const closeMenu = () => setMenuOpen(false)

  const ref = useOnClickOutside<HTMLDivElement>(closeMenu)

  const copyAddress = function () {
    navigator.clipboard.writeText(address)
    closeMenu()
  }

  return (
    <div
      className="relative flex h-10 w-fit items-center rounded-lg border border-solid border-slate-600/45 bg-white pr-1 text-sm font-medium leading-normal text-slate-950"
      ref={ref}
    >
      <span className="p-2">{balance}</span>
      <div
        className="flex cursor-pointer items-center justify-between rounded-md bg-neutral-200/65 py-1 pl-2"
        onClick={() => setMenuOpen(true)}
      >
        <span>{formattedAddress}</span>
        <Chevron.Bottom />
      </div>
      {menuOpen && (
        <Menu
          items={[
            {
              content: (
                <div
                  className="flex items-center gap-x-2"
                  onClick={copyAddress}
                >
                  <CopyLogo />
                  <span>{t('copy-address')}</span>
                </div>
              ),
              id: 'copy',
            },
            {
              content: (
                <div className="flex items-center gap-x-2" onClick={disconnect}>
                  <DisconnectLogo />
                  <span>{t('disconnect')}</span>
                </div>
              ),
              id: 'disconnect',
            },
          ]}
        />
      )}
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
      openMenu={() => setMenuOpen(true)}
    />
  )
}

export const ConnectedEvmAccount = function () {
  const { address } = useAccount()
  const { disconnect } = useEvmDisconnect()

  const { data: balance } = useBalance({ address })

  const formattedBalance =
    balance !== undefined
      ? `${getFormattedValue(formatUnits(balance.value, balance.decimals))} ${
          balance.symbol
        }`
      : undefined
  return (
    <ConnectedWallet
      address={address}
      balance={formattedBalance}
      disconnect={disconnect}
      formattedAddress={address ? formatEvmAddress(address) : '...'}
    />
  )
}

export const ConnectedBtcAccount = function () {
  const { address } = useBtcAccount()
  const { balance } = useBtcBalance()
  const { disconnect } = useBtcDisconnect()

  const getBalance = function () {
    if (balance.confirmed === 0) {
      return 0
    }
    return getFormattedValue(
      formatUnits(BigInt(balance.confirmed), bitcoin.nativeCurrency.decimals),
    )
  }

  const formattedBalance =
    balance !== undefined
      ? `${getBalance()} ${bitcoin.nativeCurrency.symbol}`
      : undefined

  return (
    <ConnectedWallet
      address={address}
      balance={formattedBalance}
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
    return <WrongNetwork onClick={() => switchChain(chains[0])} />
  }
  return <ConnectedChain icon={<BtcLogo />} name={chain.name} />
}
