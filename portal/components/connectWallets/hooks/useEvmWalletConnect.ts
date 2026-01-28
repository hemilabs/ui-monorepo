import { type WalletItemState } from 'components/connectWallets/connectWalletAccordion'
import { type EvmWalletData } from 'hooks/useAllWallets'
import { useCallback } from 'react'
import { isMobile } from 'react-device-detect'
import { useConnect, useConnections, useDisconnect } from 'wagmi'

import { getWalletConnectUri } from '../utils/walletConnect'
import { getWalletDeepLink, hasDeepLinkSupport } from '../utils/walletDeepLinks'

// These are the connector types that require a QR code to connect
// It applies to desktop devices only
const qrCodeConnectorTypes = ['walletConnect', 'binanceWallet']

// walletConnect is a generic connector so we need to handle it differently
// always showing the option to open the website so the user can connect their wallet
const isWalletConnect = (wallet: EvmWalletData) =>
  wallet.connector?.type === 'walletConnect'

function getDesktopWalletState(wallet: EvmWalletData) {
  const hasConnector = !!wallet.connector
  const needsQRCode = wallet.connector?.type
    ? qrCodeConnectorTypes.includes(wallet.connector.type)
    : false

  const canConnect = !isWalletConnect(wallet) && hasConnector && !needsQRCode

  return {
    showCheck: canConnect,
    showInstall: isWalletConnect(wallet) || !hasConnector || needsQRCode,
  }
}

const getMobileWalletState = () => ({
  showCheck: false,
  showInstall: false,
})

export const getEvmWalletState = (wallet: EvmWalletData): WalletItemState =>
  isMobile ? getMobileWalletState() : getDesktopWalletState(wallet)

// Internal type with additional properties needed for connection logic
type EvmWalletWithState = EvmWalletData & {
  canConnectDirectly: boolean
  needsQRCode: boolean
}

function getEvmWalletWithState(wallet: EvmWalletData): EvmWalletWithState {
  const hasConnector = !!wallet.connector
  const needsQRCode = wallet.connector?.type
    ? qrCodeConnectorTypes.includes(wallet.connector.type)
    : false

  const canConnectDirectly = isMobile
    ? true
    : !isWalletConnect(wallet) && hasConnector && !needsQRCode

  return {
    ...wallet,
    canConnectDirectly,
    needsQRCode,
  }
}

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
      const walletWithState = getEvmWalletWithState(wallet)
      const supportsDeepLink = hasDeepLinkSupport(wallet.id)

      // Desktop or mobile with connector: connect directly
      if (
        walletWithState.canConnectDirectly &&
        wallet.connector &&
        !isWalletConnect(wallet)
      ) {
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

      // For wallets that need QR code (desktop without direct connection)
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
