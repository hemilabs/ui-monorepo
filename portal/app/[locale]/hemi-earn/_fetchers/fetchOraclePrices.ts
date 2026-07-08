import { type QueryClient, queryOptions } from '@tanstack/react-query'
import { getTreasury } from '@vetro-protocol/gateway/actions'
import {
  getTokenConfig,
  getWhitelistedTokens,
} from '@vetro-protocol/treasury/actions'
import { tokenQueryOptions } from 'hooks/useToken'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address, formatUnits } from 'viem'
import { readContract } from 'viem/actions'

// Chainlink aggregator; reports the token's price in the gateway's peg unit, not USD.
const aggregatorV3Abi = [
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { internalType: 'uint80', name: 'roundId', type: 'uint80' },
      { internalType: 'int256', name: 'answer', type: 'int256' },
      { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
      { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
      { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// Returns { SYMBOL: pegUnitPrice } keyed by the uppercased symbol — not priceSymbol,
// which would collide when several tokens share one alias. fetchEarnTokenPrices converts to USD.
export const fetchOraclePrices = async function (
  queryClient: QueryClient,
  gatewayAddress: Address,
): Promise<Record<string, string>> {
  const client = getEvmL1PublicClient(mainnet.id)
  const treasuryAddress = await getTreasury(client, { address: gatewayAddress })
  const tokenAddresses = await getWhitelistedTokens(client, {
    address: treasuryAddress,
  })

  const entries = await Promise.all(
    tokenAddresses.map(async function (address) {
      const [token, [, oracle]] = await Promise.all([
        queryClient.ensureQueryData(
          tokenQueryOptions({ address, chainId: mainnet.id }),
        ),
        getTokenConfig(client, { address: treasuryAddress, token: address }),
      ])
      const [[, answer], decimals] = await Promise.all([
        readContract(client, {
          abi: aggregatorV3Abi,
          address: oracle,
          functionName: 'latestRoundData',
        }),
        readContract(client, {
          abi: aggregatorV3Abi,
          address: oracle,
          functionName: 'decimals',
        }),
      ])
      return [
        token.symbol.toUpperCase(),
        formatUnits(answer, decimals),
      ] as const
    }),
  )

  return Object.fromEntries(entries)
}

export const oraclePricesQueryOptions = (gatewayAddress: Address) =>
  queryOptions({
    queryFn: ({ client }) => fetchOraclePrices(client, gatewayAddress),
    queryKey: ['hemi-earn', 'oracle-prices', gatewayAddress],
    refetchInterval: 5 * 60 * 1000,
    staleTime: 30 * 1000,
  })
