'use client'

import { type Chain as RainbowKitChain } from '@rainbow-me/rainbowkit'
import { featureFlags } from 'app/featureFlags'
import {
  bitcoinTestnet,
  bitcoinMainnet,
  type BtcChain,
} from 'btc-wallet/chains'
import { hemi as hemiMainnet, hemiSepolia as hemiTestnet } from 'hemi-viem'
import { renderToString } from 'react-dom/server'
import { HemiSymbolWhite } from 'ui-common/components/hemiLogo'
import { type Chain } from 'viem'
import { mainnet, sepolia } from 'wagmi/chains'

type EvmChain = Omit<Chain, 'fees' | 'serializers'> &
  Pick<RainbowKitChain, 'iconBackground' | 'iconUrl'>

export type OrderedChains = readonly [EvmChain, ...EvmChain[]]
// Remote chains are those who can tunnel from/to Hemi
export type RemoteChain = BtcChain | EvmChain

const testnetMode = (process.env.NEXT_PUBLIC_TESTNET_MODE ?? 'false') === 'true'

export const hemi: EvmChain = {
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

export const evmNetworks: OrderedChains = [hemi, ...evmRemoteNetworks]

export const networks: RemoteChain[] = evmNetworks.concat(
  //@ts-expect-error .concat() automatically casts the result type to evmNetworks' type.
  featureFlags.btcTunnelEnabled ? [bitcoin] : [],
)

export const remoteNetworks: RemoteChain[] = evmRemoteNetworks.concat(
  //@ts-expect-error .concat() automatically casts the result type to evmNetworks' type.
  featureFlags.btcTunnelEnabled ? [bitcoin] : [],
)

export const findChainById = (chainId: RemoteChain['id']) =>
  networks.find(n => n.id === chainId)

export const isChainSupported = (chainId: RemoteChain['id']) =>
  networks.some(({ id }) => id === chainId)

export const isEvmNetwork = (chain: RemoteChain): chain is EvmChain =>
  typeof chain.id === 'number'
