import { type QueryClient } from '@tanstack/react-query'
import fetch from 'fetch-plus-plus'
import { tokenQueryOptions } from 'hooks/useToken'
import { mainnet } from 'networks/mainnet'
import { type Address } from 'viem'

// Amounts are in the pegged token's base units; shares are fractions (0-1) of the vault's total.
type CompositionResponse = {
  items: (
    | {
        amount: string
        name: string
        share: number
        token: Address
        type: 'strategy'
      }
    | { amount: string; share: number; token: Address; type: 'reserve' }
  )[]
  total: string
}

// Cached raw data (locale-free, ungrouped); grouping into display items happens in toCompositionItems.
export type CompositionData = {
  amount: bigint
  name?: string
  share: number
  symbol: string
  token: Address
  type: 'reserve' | 'strategy'
}[]

type Group = {
  amount: bigint
  isReserveBuffer: boolean
  name: string
  share: number
}

const groupItems = (
  entries: {
    amount: bigint
    isReserveBuffer?: boolean
    key: string
    name: string
    share: number
  }[],
) =>
  [
    ...entries
      .reduce(function (groups, { amount, isReserveBuffer, key, name, share }) {
        const group = groups.get(key)
        groups.set(key, {
          amount: (group?.amount ?? BigInt(0)) + amount,
          isReserveBuffer: isReserveBuffer === true,
          name,
          share: (group?.share ?? 0) + share,
        })
        return groups
      }, new Map<string, Group>())
      .values(),
  ].filter(group => group.amount > BigInt(0))

const byAmountDesc = (a: Group, b: Group) =>
  a.amount === b.amount ? 0 : a.amount > b.amount ? -1 : 1

// 'token' groups by token; 'protocol' groups by strategy name and gathers the
// idle funds of every token into a single reserve buffer, which goes last.
export const toCompositionItems = function ({
  data,
  reserveBufferLabel,
  viewMode,
}: {
  data: CompositionData
  reserveBufferLabel: string
  viewMode: 'protocol' | 'token'
}) {
  if (viewMode === 'token') {
    return groupItems(
      data.map(({ amount, share, symbol, token }) => ({
        amount,
        key: token.toLowerCase(),
        name: symbol,
        share,
      })),
    ).sort(byAmountDesc)
  }

  const strategies = groupItems(
    data
      .filter(item => item.type === 'strategy')
      .map(({ amount, name = '', share }) => ({
        amount,
        key: name,
        name,
        share,
      })),
  ).sort(byAmountDesc)

  const reserveBuffer = groupItems(
    data
      .filter(item => item.type === 'reserve')
      .map(({ amount, share }) => ({
        amount,
        isReserveBuffer: true,
        key: 'reserve',
        name: reserveBufferLabel,
        share,
      })),
  )

  return [...strategies, ...reserveBuffer]
}

export const fetchComposition = async function ({
  apiUrl,
  queryClient,
  stakingVault,
}: {
  apiUrl: string
  queryClient: QueryClient
  stakingVault: Address
}): Promise<CompositionData> {
  const { items } = (await fetch(
    `${apiUrl}/variable-stake/composition/${stakingVault}`,
  )) as CompositionResponse

  // The endpoint returns addresses but no metadata; resolve each via the shared (cached) token query.
  const uniqueAddresses = [...new Set(items.map(item => item.token))]

  const tokens = await Promise.all(
    uniqueAddresses.map(address =>
      queryClient.ensureQueryData(
        tokenQueryOptions({ address, chainId: mainnet.id }),
      ),
    ),
  )

  return items.map(item => ({
    amount: BigInt(item.amount),
    name: item.type === 'strategy' ? item.name : undefined,
    share: item.share,
    symbol: tokens[uniqueAddresses.indexOf(item.token)].symbol,
    token: item.token,
    type: item.type,
  }))
}
