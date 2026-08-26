import { type WalletItemState } from 'components/connectWallets/connectWalletAccordion'
import { type EvmWalletData } from 'hooks/useAllWallets'
import { useCallback } from 'react'
import { isMobile } from 'react-device-detect'
import { useConnect, useConnections, useDisconnect } from 'wagmi'

import { getWalletConnectUri } from '../utils/walletConnect'
import { getWalletDeepLink, hasDeepLinkSupport } from '../utils/walletDeepLinks'
import { getWalletDownloadUrl } from '../utils/walletDownloadUrl'

// These are the connector types that require a QR code to connect
// It applies to desktop devices only
const qrCodeConnectorTypes = ['walletConnect', 'binanceWallet']

// Extension wallets that are not injected can still be connected by scanning a
// WalletConnect QR code, because they ship a mobile app with WalletConnect
// support. Extension-only wallets (e.g. MetaMask, Rabby, Phantom) are omitted:
// when they are not installed the only option is to download the extension.
const walletConnectQrCodeWalletIds = ['okx', 'tokenPocket']

// walletConnect is a generic connector so we need to handle it differently
// always showing the option to open the website so the user can connect their wallet
const isWalletConnect = (wallet: EvmWalletData) =>
  wallet.connector?.type === 'walletConnect'

// Whether the wallet can be connected directly through its own injected/SDK
// connector (i.e. not through a QR code).
const canConnectWithConnector = function (wallet: EvmWalletData) {
  const connectorType = wallet.connector?.type
  return !!connectorType && !qrCodeConnectorTypes.includes(connectorType)
}

// Whether the wallet is connected by scanning a QR code. This is the dedicated
// WalletConnect wallet, Binance, or a WalletConnect-capable extension wallet
// that is not currently connectable through its own connector.
const usesQrCodeConnection = function (wallet: EvmWalletData) {
  if (canConnectWithConnector(wallet)) {
    return false
  }
  return (
    wallet.id === 'walletConnect' ||
    wallet.connector?.type === 'binanceWallet' ||
    walletConnectQrCodeWalletIds.includes(wallet.id)
  )
}

function getDesktopWalletState(wallet: EvmWalletData) {
  const canConnect = canConnectWithConnector(wallet)
  const showQrCode = usesQrCodeConnection(wallet)

  return {
    showCheck: canConnect,
    // Everything that is neither directly connectable nor QR-based can only be
    // installed (e.g. an uninstalled extension-only wallet).
    showInstall: !canConnect && !showQrCode,
    showQrCode,
  }
}

const getMobileWalletState = () => ({
  showCheck: false,
  showInstall: false,
  showQrCode: false,
})

export const getEvmWalletState = (wallet: EvmWalletData): WalletItemState =>
  isMobile ? getMobileWalletState() : getDesktopWalletState(wallet)

type UseEvmWalletConnectReturn = {
  // Returns true if detail view (QR code) should be shown
  handleConnect: (wallet: EvmWalletData) => Promise<boolean>
}

export function useEvmWalletConnect(): UseEvmWalletConnectReturn {
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

  const connectWithDeepLink = useCallback(
    async function (wallet: EvmWalletData) {
      const wcConnector = connectors.find(c => c.id === 'walletConnect')
      if (!wcConnector) {
        return true
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
            return false
          }
        }
      } catch {
        return true
      }
      return true
    },
    [connectAsync, connectors, disconnectAll],
  )

  const handleConnect = useCallback(
    async function (wallet: EvmWalletData) {
      const supportsDeepLink = hasDeepLinkSupport(wallet.id)

      // Preserve the original direct-connect condition: on mobile any injected
      // wallet (except WalletConnect) connects directly, on desktop only wallets
      // reachable through their own (non-QR) connector do.
      const canConnectDirectly = isMobile
        ? !isWalletConnect(wallet)
        : canConnectWithConnector(wallet)

      // Desktop or mobile with connector: connect directly
      if (canConnectDirectly && wallet.connector) {
        // Disconnect all existing connections before connecting a new wallet
        // This prevents multiple simultaneous connections in wagmi v2
        await disconnectAll()
        await connectAsync({ connector: wallet.connector })
        return false
      }

      // Mobile without connector but with deep link support (TokenPocket, OKX, Phantom)
      if (isMobile && supportsDeepLink && !wallet.connector) {
        return connectWithDeepLink(wallet)
      }

      // Desktop extension-only wallet that is not installed: there is nothing to
      // scan, so send the user to its download page instead of a QR code.
      if (!isMobile && !usesQrCodeConnection(wallet)) {
        const downloadUrl = getWalletDownloadUrl(wallet)
        if (downloadUrl) {
          window.open(downloadUrl, '_blank', 'noopener,noreferrer')
        }
        return false
      }

      // For wallets that need QR code (desktop QR wallets, or mobile fallback)
      // Return true to show the QR code view, which handles
      // starting the WalletConnect session on its own
      return true
    },
    [connectAsync, connectWithDeepLink, disconnectAll],
  )

  return {
    handleConnect,
  }
}
