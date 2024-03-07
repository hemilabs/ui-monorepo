'use client'

import { hemiMainnet, hemiTestnet } from 'hemi-metadata'
import { type Chain } from 'viem'
import { mainnet, sepolia } from 'wagmi/chains'

type OrderedChains = readonly [Chain, ...Chain[]]

const testnetMode = (process.env.NEXT_PUBLIC_TESTNET_MODE ?? 'false') === 'true'

export const hemi: Chain = testnetMode ? hemiTestnet : hemiMainnet

export const bridgeableNetworks: OrderedChains = testnetMode
  ? [sepolia]
  : [mainnet]

export const networks: OrderedChains = [hemi, ...bridgeableNetworks]
