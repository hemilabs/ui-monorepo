import { type WalletItemState } from 'components/connectWallets/connectWalletAccordion'
import { type EvmWalletData } from 'hooks/useAllWallets'
import { useCallback } from 'react'
import { isMobile } from 'react-device-detect'
import { useConnect, useConnections, useDisconnect } from 'wagmi'

import { getWalletConnectUri } from '../utils/walletConnect'
import { getWalletDeepLink, hasDeepLinkSupport } from '../utils/walletDeepLinks'
import { getWalletDownloadUrl } from '../utils/walletDownloadUrl'

const qrCodeConnectorTypes = ['walletConnect', 'binanceWallet']
const walletConnectQrCodeWalletIds = ['okx', 'tokenPocket']

const isWalletConnect = (wallet: EvmWalletData) =>
  wallet.connector?.type === 'walletConnect'

const canConnectWithConnector = function (wallet: EvmWalletData) {
  const connectorType = wallet.connector?.type
  return !!connectorType && !qrCodeConnectorTypes.includes(connectorType)
}

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
        const { promise } = getWalletConnectUri(wcConnector)
        const uri = await promise

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
      const canConnectDirectly = isMobile
        ? !isWalletConnect(wallet)
        : canConnectWithConnector(wallet)

      // Desktop or mobile with connector: connect directly
      if (canConnectDirectly && wallet.connector) {
        await disconnectAll()
        await connectAsync({ connector: wallet.connector })
        return false
      }

      // Mobile with deep link support (TokenPocket, OKX, Phantom)
      if (isMobile && supportsDeepLink && !wallet.connector) {
        return connectWithDeepLink(wallet)
      }

      // Desktop extension-only wallet that is not installed: download page
      if (!isMobile && !usesQrCodeConnection(wallet)) {
        const downloadUrl = getWalletDownloadUrl(wallet)
        if (downloadUrl) {
          window.open(downloadUrl, '_blank', 'noopener,noreferrer')
        }
        return false
      }

      // Return true to show the QR code view
      return true
    },
    [connectAsync, connectWithDeepLink, disconnectAll],
  )

  return {
    handleConnect,
  }
}
