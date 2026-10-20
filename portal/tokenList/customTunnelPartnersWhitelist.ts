import hemilabsTokenList from '@hemilabs/token-list'
import { hemi } from 'hemi-viem'
import { type EvmToken, type Extensions } from 'types/token'
import { getTunnelPairs } from 'utils/tunnelPairs'
import { type Chain } from 'viem'

type PartnerExtensions = Pick<
  Extensions,
  'tunnelSymbol' | 'tunnelPartners' | 'tunnelDstAddress'
>

// Keyed by the Hemi token. "l1" applies to its bridgeInfo pair or OFT peer on Ethereum.
const hemiPartners: Record<
  string,
  { l1?: PartnerExtensions; l2?: PartnerExtensions }
> = {
  // cbBTC
  '0x1596bE338B999E2376675C908168A7548C8B0525': {
    l1: {
      tunnelDstAddress: '0x9778bC12904DB935Ca8be4fae26636BF7D6Da456',
      tunnelPartners: ['stargate'],
    },
  },
  // USDC
  '0xad11a8BEb98bbf61dbb1aa0F6d6F2ECD87b35afA': {
    l1: {
      tunnelPartners: ['jumper', 'stargate'],
      tunnelSymbol: 'USDC',
    },
    l2: {
      tunnelPartners: ['jumper', 'stargate'],
      tunnelSymbol: 'USDC',
    },
  },
  // USDT
  '0xbB0D083fb1be0A9f6157ec484b6C79E0A4e31C2e': {
    l1: {
      tunnelPartners: ['stargate'],
    },
    l2: {
      tunnelPartners: ['stargate'],
      tunnelSymbol: 'USDT',
    },
  },
  // svetBTC
  '0xD8D63De3b64bd06d99F8F5AD8B78Ed2fE7525eC0': {
    l1: {
      tunnelPartners: ['stargate'],
    },
    l2: {
      tunnelPartners: ['stargate'],
    },
  },
  // Vetro USD
  '0xD3599AE62EE280709A22268a46d23164214e345B': {
    l1: {
      tunnelPartners: ['stargate'],
    },
    l2: {
      tunnelPartners: ['stargate'],
    },
  },
  // sVUSD
  '0xfe875CC86cC6BC2E93ab330D6b2c408C3Cd79710': {
    l1: {
      tunnelPartners: ['stargate'],
    },
    l2: {
      tunnelPartners: ['stargate'],
    },
  },
  // vetBTC
  '0xfF16E26B7fFCf24c378D57DF536dC5eC104a7dE4': {
    l1: {
      tunnelPartners: ['stargate'],
    },
    l2: {
      tunnelPartners: ['stargate'],
    },
  },
}

const getL1Address = function (address: string) {
  const extensions = (hemilabsTokenList.tokens as EvmToken[]).find(
    t => t.chainId === hemi.id && t.address === address,
  )?.extensions
  const l1Address = getTunnelPairs(extensions)?.[hemi.sourceId]?.tokenAddress
  if (!l1Address) {
    throw new Error(`Failed to find the L1 pair of ${address}`)
  }
  return l1Address
}

const partnerEntries = Object.entries(hemiPartners)

export const customTunnelPartnersWhitelist: Partial<
  Record<Chain['id'], Record<string, PartnerExtensions>>
> = {
  [hemi.sourceId]: Object.fromEntries(
    partnerEntries
      .filter(([, { l1 }]) => l1 !== undefined)
      .map(([address, { l1 }]) => [getL1Address(address), l1!]),
  ),
  [hemi.id]: Object.fromEntries(
    partnerEntries
      .filter(([, { l2 }]) => l2 !== undefined)
      .map(([address, { l2 }]) => [address, l2!]),
  ),
}
