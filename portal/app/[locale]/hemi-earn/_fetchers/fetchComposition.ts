import { type QueryClient } from '@tanstack/react-query'
import { gateways } from '@vetro-protocol/gateway'
import fetch from 'fetch-plus-plus'
import { tokenQueryOptions } from 'hooks/useToken'
import { tokenPricesQueryOptions } from 'hooks/useTokenPrices'
import { mainnet } from 'networks/mainnet'
import { type Token } from 'types/token'
import { type Address, formatUnits, isAddressEqual } from 'viem'

import { gatewayForShareQueryOptions } from '../_hooks/gatewayForShare'

// Amounts are in erc20 minimal units; latestPrice is in the gateway's peg unit
// (e.g. BTC for the vetBTC gateway), so USD = latestPrice × pegPrice.
type TreasuryToken = {
  activeStrategies: { name: string; totalDebt: string }[]
  latestPrice: string
  priceDecimals: number
  tokenAddress: Address
  totalDebt: string
  withdrawable: string
}

// Cached raw data (locale-free, ungrouped); grouping into display items happens in toCompositionItems.
export type CompositionData = {
  strategies: { amount: number; name: string }[]
  symbol: string
  totalDebt: number
  withdrawable: number
}[]

const toCompositionData = function (
  treasury: TreasuryToken[],
  tokens: Token[],
  pegPrice: number,
): CompositionData {
  const data: CompositionData = []

  for (const {
    activeStrategies,
    latestPrice,
    priceDecimals,
    tokenAddress,
    totalDebt,
    withdrawable,
  } of treasury) {
    const token = tokens.find(t =>
      isAddressEqual(t.address as Address, tokenAddress),
    )
    if (token === undefined) {
      continue
    }
    const price =
      Number(formatUnits(BigInt(latestPrice), priceDecimals)) * pegPrice
    const toUsd = (value: string) =>
      Number(formatUnits(BigInt(value), token.decimals)) * price

    data.push({
      strategies: activeStrategies.map(strategy => ({
        amount: toUsd(strategy.totalDebt),
        name: strategy.name,
      })),
      symbol: token.symbol,
      totalDebt: toUsd(totalDebt),
      withdrawable: toUsd(withdrawable),
    })
  }

  return data
}

// 'protocol' groups by strategy and appends idle funds (withdrawable − totalDebt)
// as a reserve buffer; 'token' groups by token (idle already included).
export const toCompositionItems = function ({
  data,
  reserveBufferLabel,
  viewMode,
}: {
  data: CompositionData
  reserveBufferLabel: string
  viewMode: 'protocol' | 'token'
}) {
  const items: { amount: number; isReserveBuffer?: boolean; name: string }[] =
    viewMode === 'token'
      ? data.map(({ symbol, withdrawable }) => ({
          amount: withdrawable,
          name: symbol,
        }))
      : data.flatMap(token => token.strategies)

  if (viewMode === 'protocol') {
    const reserveBuffer = Math.max(
      0,
      data.reduce(
        (sum, token) => sum + token.withdrawable - token.totalDebt,
        0,
      ),
    )
    if (reserveBuffer > 0) {
      items.push({
        amount: reserveBuffer,
        isReserveBuffer: true,
        name: reserveBufferLabel,
      })
    }
  }

  const visible = items.filter(item => item.amount > 0)
  const total = visible.reduce((sum, item) => sum + item.amount, 0)
  return visible.map(item => ({
    amount: item.amount,
    isReserveBuffer: item.isReserveBuffer === true,
    name: item.name,
    share: total > 0 ? (item.amount / total) * 100 : 0,
  }))
}

export const fetchComposition = async function ({
  apiUrl,
  queryClient,
  shareAddress,
}: {
  apiUrl: string
  queryClient: QueryClient
  shareAddress: Address
}): Promise<CompositionData> {
  const gatewayAddress = await queryClient.ensureQueryData(
    gatewayForShareQueryOptions(shareAddress),
  )
  // Oracles are in the gateway's peg unit, so one peg-symbol price covers every token (USD peg = identity).
  const pegBaseSymbol = gateways.find(gateway =>
    isAddressEqual(gateway.address, gatewayAddress),
  )?.pegBaseSymbol
  if (pegBaseSymbol === undefined) {
    throw new Error(`No peg base symbol for gateway ${gatewayAddress}`)
  }

  const treasury = (await fetch(
    `${apiUrl}/analytics/treasury/${gatewayAddress}`,
  )) as TreasuryToken[]

  // The endpoint returns addresses but no metadata; resolve each via the shared (cached) token query.
  const uniqueAddresses = [
    ...new Set(treasury.map(token => token.tokenAddress)),
  ]

  const [tokens, prices] = await Promise.all([
    Promise.all(
      uniqueAddresses.map(address =>
        queryClient.ensureQueryData(
          tokenQueryOptions({ address, chainId: mainnet.id }),
        ),
      ),
    ),
    queryClient.ensureQueryData(tokenPricesQueryOptions()),
  ])
  // The feed quotes prices in USD, so the USD peg itself is 1
  const pegPrice = Number({ USD: '1', ...prices }[pegBaseSymbol] ?? '0')

  return toCompositionData(treasury, tokens, pegPrice)
}
