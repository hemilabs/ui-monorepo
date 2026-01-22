import { AnalyticsEvent } from 'app/analyticsEvents'
import { Chevron } from 'components/icons/chevron'
import { OrangeCheckIcon } from 'components/icons/orangeCheckIcon'
import { Tooltip } from 'components/tooltip'
import { type WalletData } from 'hooks/useAllWallets'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'
import { ReactNode, useCallback, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { useConnect, useConnections, useDisconnect } from 'wagmi'

import { EvmWalletLogo } from './evmWalletLogo'
import { DownloadIcon } from './icons/download'
import { getWalletConnectUri } from './utils/walletConnect'
import { getWalletDeepLink, hasDeepLinkSupport } from './utils/walletDeepLinks'
import { WalletQRCodeView } from './walletQRCodeView'

// These are the connector types that require a QR code to connect
// It applies to desktop devices only
const qrCodeConnectorTypes = ['walletConnect', 'binanceWallet']
// walletConnect is a generic connector so we need to handle it differently
// always showing the option to open the website so the user can connect their wallet
const isWalletConnect = (wallet: WalletData) =>
  wallet.connector?.type === 'walletConnect'

function getDesktopWalletState(wallet: WalletData) {
  const hasConnector = !!wallet.connector
  const needsQRCode = wallet.connector?.type
    ? qrCodeConnectorTypes.includes(wallet.connector.type)
    : false

  const canConnect = !isWalletConnect(wallet) && hasConnector && !needsQRCode

  return {
    canConnectDirectly: canConnect,
    hasConnector,
    needsQRCode,
    showCheck: canConnect,
    showInstall: isWalletConnect(wallet) || !hasConnector || needsQRCode,
  }
}

const getMobileWalletState = (wallet: WalletData) => ({
  canConnectDirectly: true,
  hasConnector: !!wallet.connector,
  needsQRCode: false,
  showCheck: false,
  showInstall: false,
})

const getWalletState = (wallet: WalletData) =>
  isMobile ? getMobileWalletState(wallet) : getDesktopWalletState(wallet)

type Props = {
  event: AnalyticsEvent
  icon: ReactNode
  text: string
  wallets: WalletData[]
}

export const ConnectWalletAccordion = function ({
  event,
  icon,
  text,
  wallets,
}: Props) {
  const { track } = useUmami()
  const t = useTranslations('connect-wallets')
  const [isOpen, setIsOpen] = useState(true)
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null)
  const connections = useConnections()
  const { connectAsync, connectors } = useConnect()
  const { disconnectAsync } = useDisconnect()

  // Disconnect all active connections before connecting a new wallet
  // This is necessary because wagmi v2 allows multiple simultaneous connections
  const disconnectAll = useCallback(
    async function () {
      for (const connection of connections) {
        await disconnectAsync({ connector: connection.connector })
      }
    },
    [connections, disconnectAsync],
  )

  // Get the WalletConnect connector for QR code connections
  const walletConnectConnector = connectors.find(c => c.id === 'walletConnect')

  // Following RainbowKit's pattern: start connection
  const startWalletConnectSession = useCallback(
    async function () {
      if (!walletConnectConnector) {
        return
      }

      // Disconnect all existing connections before connecting a new wallet
      await disconnectAll()

      // Start connection - intentionally not awaited to avoid blocking the UI while user approves
      // This follows RainbowKit's pattern:
      // https://github.com/rainbow-me/rainbowkit/blob/d1c94fbb7a6c5a78a5f618f4bf3061dd074c2807/packages/rainbowkit/src/components/ConnectOptions/DesktopOptions.tsx#L115
      // where they call wallet.connect() without await
      connectAsync({ connector: walletConnectConnector })
    },
    [connectAsync, disconnectAll, walletConnectConnector],
  )

  const handleClick = function () {
    track?.(event)
    setIsOpen(!isOpen)
  }

  async function connectWithDeepLink(wallet: WalletData) {
    const wcConnector = connectors.find(c => c.id === 'walletConnect')
    if (!wcConnector) {
      return
    }

    try {
      // Disconnect all existing connections before connecting a new wallet
      await disconnectAll()
      // Use connectAsync following RainbowKit's pattern
      // Start connection - intentionally not awaited to avoid blocking the UI while user approves
      // This follows RainbowKit's pattern:
      // https://github.com/rainbow-me/rainbowkit/blob/d1c94fbb7a6c5a78a5f618f4bf3061dd074c2807/packages/rainbowkit/src/components/ConnectOptions/DesktopOptions.tsx#L115
      connectAsync({ connector: wcConnector })
      const uri = await getWalletConnectUri(wcConnector)

      if (uri) {
        const deepLink = getWalletDeepLink(wallet.id)
        if (deepLink) {
          const connectionUrl = `${deepLink}wc?uri=${encodeURIComponent(uri)}`
          window.location.href = connectionUrl
        }
      }
    } catch {
      setSelectedWallet(wallet)
    }
  }

  async function handleWalletConnect(wallet: WalletData) {
    const { canConnectDirectly } = getWalletState(wallet)
    const supportsDeepLink = hasDeepLinkSupport(wallet.id)

    // Desktop or mobile with connector: connect directly
    if (canConnectDirectly && wallet.connector && !isWalletConnect(wallet)) {
      const attemptConnection = async function () {
        // Disconnect all existing connections before connecting a new wallet
        // This prevents multiple simultaneous connections in wagmi v2
        await disconnectAll()
        await connectAsync({ connector: wallet.connector! })
      }

      attemptConnection()
      return
    }

    // Mobile without connector but with deep link support (TokenPocket, OKX, Phantom)
    if (isMobile && supportsDeepLink && !wallet.connector) {
      await connectWithDeepLink(wallet)
    }

    // For wallets that need QR code (desktop without direct connection)
    // Start the WalletConnect session BEFORE showing the QRCodeView
    // This follows RainbowKit's pattern where connection starts in selectWallet
    if (!isMobile) {
      await startWalletConnectSession()
    }

    setSelectedWallet(wallet)
  }

  const sortedWallets = [...wallets].sort(function (a, b) {
    const aState = getWalletState(a)
    const bState = getWalletState(b)

    if (aState.showCheck && !bState.showCheck) {
      return -1
    }
    if (!aState.showCheck && bState.showCheck) {
      return 1
    }

    return 0
  })

  return (
    <div className="rounded-lg bg-white shadow-sm">
      <button
        className="hover:bg-connect-wallet-hovered group flex w-full cursor-pointer items-center gap-x-2 p-4"
        onClick={handleClick}
      >
        {icon}
        <span className="text-base font-medium text-neutral-950">{text}</span>
        <div className="group ml-auto">
          {isOpen ? (
            <Chevron.Bottom className="size-5 group-hover:[&>path]:fill-neutral-950" />
          ) : (
            <Chevron.Right className="size-5 group-hover:[&>path]:fill-neutral-950" />
          )}
        </div>
      </button>

      <div
        className={`h-px border-t border-neutral-300/55 ${
          isOpen ? 'block' : 'hidden'
        }`}
      />
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-120' : 'max-h-0'
        }`}
      >
        <div className="relative overflow-hidden">
          <div
            className={`p-3 transition-transform duration-300 ${
              selectedWallet ? '-translate-x-full' : 'translate-x-0'
            }`}
          >
            <h4 className="mb-3 mt-1 text-neutral-500">{t('wallets')}</h4>
            <div className="flex gap-2 overflow-x-auto p-1 md:grid md:grid-cols-3 md:overflow-x-visible md:p-0">
              {sortedWallets.map(function (wallet) {
                const { showCheck, showInstall } = getWalletState(wallet)

                return (
                  <button
                    className="size-30 group relative mb-2 flex shrink-0 flex-col items-center justify-center gap-2 rounded-lg bg-neutral-50/80 p-2 transition-shadow duration-300 hover:shadow-sm md:mb-0"
                    key={wallet.id}
                    onClick={() => handleWalletConnect(wallet)}
                  >
                    {showCheck && (
                      <div className="absolute right-2 top-2">
                        <Tooltip
                          borderRadius="6px"
                          id="wallet-installed"
                          text={t('installed')}
                          variant="simple"
                        >
                          <OrangeCheckIcon size="small" />
                        </Tooltip>
                      </div>
                    )}
                    <EvmWalletLogo
                      className="size-14"
                      walletName={wallet.name}
                    />
                    <span className="text-center text-sm font-medium text-neutral-950">
                      {wallet.name}
                    </span>
                    {showInstall && (
                      <div className="group-hover:backdrop-blur-2 absolute inset-0 flex items-center justify-center rounded-lg bg-white/80 opacity-0 transition-all duration-300 group-hover:opacity-100">
                        <div className="flex items-center gap-1 text-orange-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <DownloadIcon />
                          <span className="text-sm font-semibold">
                            {t('install')}
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
          <div
            className={`absolute inset-0 m-4 transition-transform duration-300 ${
              selectedWallet ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {selectedWallet && (
              <WalletQRCodeView
                onBack={() => setSelectedWallet(null)}
                wallet={selectedWallet}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
