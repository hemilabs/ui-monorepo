'use client'

import { type Chain } from '@rainbow-me/rainbowkit'
import { bitcoinTestnet, bitcoinMainnet } from 'btc-wallet/chains'
import { hemiMainnet, hemiTestnet } from 'hemi-metadata'
import { renderToString } from 'react-dom/server'
import { HemiSymbolWhite } from 'ui-common/components/hemiLogo'
import { mainnet, sepolia } from 'wagmi/chains'

export type OrderedChains = readonly [Chain, ...Chain[]]

const testnetMode = (process.env.NEXT_PUBLIC_TESTNET_MODE ?? 'false') === 'true'

export const hemi: Chain = {
  ...(testnetMode ? hemiTestnet : hemiMainnet),
  iconBackground: '#FFFFFF',
  iconUrl: () =>
    Promise.resolve(
      `data:image/svg+xml;base64,${btoa(renderToString(<HemiSymbolWhite />))}`,
    ),
}

export const bitcoin = testnetMode ? bitcoinTestnet : bitcoinMainnet

// EVM-compatible networks that can tunnel to/from Hemi
export const evmRemoteNetworks: OrderedChains = testnetMode
  ? [sepolia]
  : [mainnet]

export const networks: OrderedChains = [hemi, ...evmRemoteNetworks]

export const isChainSupported = (chainId: Chain['id']) =>
  networks.some(({ id }) => id === chainId)
