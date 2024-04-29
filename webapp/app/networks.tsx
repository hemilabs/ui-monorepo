'use client'

import { type Chain } from '@rainbow-me/rainbowkit'
import { hemiMainnet, hemiTestnet } from 'hemi-metadata'
import { renderToString } from 'react-dom/server'
import { HemiSymbolWhite } from 'ui-common/components/hemiLogo'
import { mainnet, sepolia } from 'wagmi/chains'

type OrderedChains = readonly [Chain, ...Chain[]]

const testnetMode = (process.env.NEXT_PUBLIC_TESTNET_MODE ?? 'false') === 'true'

export const hemi: Chain = {
  ...(testnetMode ? hemiTestnet : hemiMainnet),
  iconBackground: '#FFFFFF',
  iconUrl: () =>
    Promise.resolve(
      `data:image/svg+xml;base64,${btoa(renderToString(<HemiSymbolWhite />))}`,
    ),
}

export const bridgeableNetworks: OrderedChains = testnetMode
  ? [sepolia]
  : [mainnet]

export const networks: OrderedChains = [hemi, ...bridgeableNetworks]
