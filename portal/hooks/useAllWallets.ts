import { type Wallet } from '@rainbow-me/rainbowkit'
import {
  type ConnectorGroup,
  type WalletConnector,
} from 'btc-wallet/connectors/types'
import { useConfig as useBtcConfig } from 'btc-wallet/hooks/useConfig'
import { allWalletConnectors } from 'context/evmWalletContext'
import { useMemo } from 'react'
import { type Connector, useConnect } from 'wagmi'

export type EvmWalletData = {
  connector?: Connector
  downloadUrls: Wallet['downloadUrls']
  id: Wallet['id']
  installed: boolean
  name: Wallet['name']
}

export type BtcWalletData = {
  connector: WalletConnector
  downloadUrls: ConnectorGroup['downloadUrls']
  id: string
  installed: boolean
  name: string
}

type AllWallets = {
  btcWallets: BtcWalletData[]
  evmWallets: EvmWalletData[]
}

export function useAllWallets(): AllWallets {
  const { connectors: evmConnectors } = useConnect()
  const { connectors: btcConnectors } = useBtcConfig()

  const evmWallets = useMemo(
    () =>
      allWalletConnectors.map(function (wallet) {
        const connector = evmConnectors.find(c => c.name === wallet.name)

        // A wallet is installed if:
        // 1. RainbowKit detected it (wallet.installed), OR
        // 2. We found a matching connector (especially for EIP-6963 auto-discovered wallets)
        const installed = wallet.installed ?? !!connector

        return {
          connector,
          downloadUrls: wallet.downloadUrls,
          id: wallet.id,
          installed,
          name: wallet.name,
        }
      }),
    [evmConnectors],
  )

  const btcWallets = useMemo(
    () =>
      btcConnectors.map(connectorGroup => ({
        connector: connectorGroup.wallet,
        downloadUrls: connectorGroup.downloadUrls,
        id: connectorGroup.wallet.id,
        installed: connectorGroup.wallet.isInstalled(),
        name: connectorGroup.name,
      })),
    [btcConnectors],
  )

  return {
    btcWallets,
    evmWallets,
  }
}
