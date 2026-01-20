import { type Wallet } from '@rainbow-me/rainbowkit'
import { allWalletConnectors } from 'context/evmWalletContext'
import { useMemo } from 'react'
import { type Connector, useConnect } from 'wagmi'

export type WalletData = {
  connector?: Connector
  downloadUrls: Wallet['downloadUrls']
  id: Wallet['id']
  installed: boolean
  name: Wallet['name']
}

export function useAllWallets(): WalletData[] {
  const { connectors: evmConnectors } = useConnect()

  return useMemo(
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
}
