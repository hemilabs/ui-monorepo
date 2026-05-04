import { useQuery } from '@tanstack/react-query'
import { type Address, type Chain } from 'viem'

export type CompositionViewMode = 'token' | 'protocol'

export type CompositionItem = {
  amount: number
  apy: number
  name: string
  share: number
}

// Simple seeded pseudo-random for deterministic mock data
const seededRandom = function (seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

const tokenMockData: CompositionItem[] = [
  { amount: 6_342_160, apy: 1.01, name: 'Other positions', share: 32 },
  { amount: 5_556_931, apy: 1.01, name: 'Morphoblue - Steakhouse', share: 28 },
  { amount: 2_849_340, apy: 1.01, name: 'Spark - eth', share: 14.4 },
  { amount: 2_697_935, apy: 1.01, name: 'Lagoon - Vault', share: 13.6 },
  {
    amount: 2_160_089,
    apy: 1.01,
    name: 'Originstory - ARM-WETH-stETH',
    share: 10.9,
  },
  { amount: 219_361, apy: 1.01, name: 'Wallet', share: 1.1 },
]

const generateMockData = function (viewMode: CompositionViewMode) {
  if (viewMode === 'token') {
    return tokenMockData
  }
  // For protocol view, generate slightly different data
  return [
    { amount: 7_100_000, apy: 1.02, name: 'Morpho', share: 35.8 },
    { amount: 4_200_000, apy: 0.98, name: 'Spark', share: 21.2 },
    { amount: 3_500_000, apy: 1.01, name: 'Lagoon', share: 17.6 },
    { amount: 2_800_000, apy: 1.05, name: 'Originstory', share: 14.1 },
    {
      amount: 2_225_816,
      apy: seededRandom(42) * 2,
      name: 'Other',
      share: 11.3,
    },
  ]
}

const mockDelay = 2000

type UseComposition = {
  chainId: Chain['id']
  vaultAddress: Address
  viewMode: CompositionViewMode
}

// TODO: replace mocked data with real API call once the backend endpoint is available.
export const useComposition = ({
  chainId,
  vaultAddress,
  viewMode,
}: UseComposition) =>
  useQuery({
    queryFn: () =>
      new Promise<CompositionItem[]>(resolve =>
        setTimeout(() => resolve(generateMockData(viewMode)), mockDelay),
      ),
    queryKey: ['composition', chainId, vaultAddress, viewMode],
  })
