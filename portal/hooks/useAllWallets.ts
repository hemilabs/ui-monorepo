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

        return {
          connector,
          downloadUrls: wallet.downloadUrls,
          id: wallet.id,
          installed: wallet.installed ?? false,
          name: wallet.name,
        }
      }),
    [evmConnectors],
  )
}
