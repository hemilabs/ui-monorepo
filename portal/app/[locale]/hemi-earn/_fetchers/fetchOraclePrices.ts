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

// Minimal Chainlink aggregator interface. A whitelisted token's oracle reports
// the token's price denominated in the gateway's peg unit (e.g. WBTC/BTC for
// the vetBTC gateway), not USD.
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

// Reads every whitelisted-token oracle for a gateway and returns a
// `{ SYMBOL: price }` dict where each price is denominated in the gateway's peg
// unit (BTC for the vetBTC gateway, USD for VUSD). `fetchEarnTokenPrices`
// converts these to USD. The dict is keyed by the token's uppercased symbol so
// each entry is unique within the gateway — `priceSymbol` is only a downstream
// lookup alias and would collide here when several tokens share one alias.
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
    // refetch every 5 min
    refetchInterval: 5 * 60 * 1000,
    staleTime: 30 * 1000,
  })
