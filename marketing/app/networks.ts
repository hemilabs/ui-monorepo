'use client'

import { hemiMainnet, hemiTestnet } from 'hemi-metadata'
import { mainnet, sepolia } from 'wagmi/chains'

const testnetMode = (process.env.NEXT_PUBLIC_TESTNET_MODE ?? 'false') === 'true'

export const hemi = testnetMode ? hemiTestnet : hemiMainnet

export const bridgeableNetworks = testnetMode ? [sepolia] : [mainnet]

export const networks = [hemi, ...bridgeableNetworks]
