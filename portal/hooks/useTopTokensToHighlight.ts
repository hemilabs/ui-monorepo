import { useQueries } from '@tanstack/react-query'
import { Token } from 'types/token'
import { isL2NetworkId } from 'utils/chain'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { isNativeToken } from 'utils/nativeToken'
import { getErc20TokenBalance } from 'viem-erc20/actions'
import { useAccount } from 'wagmi'

import { useHemiClient } from './useHemiClient'

/**
 * Normalize balances to 18 decimals to allow fair comparison across tokens.
 *
 * Many tokens (e.g., USDC) use different decimal formats than others (e.g., ETH),
 * so comparing raw balances directly (bigint) can be misleading.
 *
 * For example:
 * - 1 ETH has 18 decimals → 1 ETH = 1_000_000_000_000_000_000
 * - 1 USDC has 6 decimals → 1 USDC = 1_000_000
 *
 * Without normalization, 1 ETH would appear 1,000,000x larger than 1 USDC.
 * These functions adjusts all balances to a common 18-decimal scale before sorting.
 */
function powBigInt(base: bigint, exponent: number) {
  let result = BigInt(1)
  for (let i = 0; i < exponent; i++) {
    result *= base
  }
  return result
}

function normalizeBalance(balance: bigint, decimals: number) {
  const diff = 18 - decimals
  if (diff === 0) return balance
  if (diff > 0) return balance * powBigInt(BigInt(10), diff)
  return balance / powBigInt(BigInt(10), -diff)
}

type Props = {
  limit?: number
  tokens: Token[]
}

export function useTopTokensToHighlight({ limit = 3, tokens }: Props) {
  const { address: account, isConnected } = useAccount()
  const hemiClient = useHemiClient()

  return useQueries({
    combine(results) {
      if (!isConnected || !account) {
        return {
          isError: false,
          isLoading: false,
          sortedTokens: [] as Token[], // Cast is needed to satisfy TypeScript
          // because the type of sortedTokens is inferred from the select function
        }
      }

      const successfulResults = results.filter(
        ({ data, status }) =>
          status === 'success' && typeof data?.balance === 'bigint',
      )

      const sortedResults = successfulResults
        .filter(
          ({ data }) =>
            normalizeBalance(data!.balance, data!.decimals) > BigInt(0),
        )
        .sort(function (a, b) {
          const aNorm = normalizeBalance(a.data!.balance, a.data!.decimals)
          const bNorm = normalizeBalance(b.data!.balance, b.data!.decimals)

          if (aNorm > bNorm) return -1
          if (aNorm < bNorm) return 1
          return 0
        })
        .slice(0, limit)
        .map(({ data }) => ({ ...data! }))

      return {
        isError: results.some(r => r.isError),
        isLoading: results.some(r => r.isLoading),
        sortedTokens: [...sortedResults],
      }
    },
    queries: tokens.map(function (token) {
      // We can safely cast here it's an evm token
      const chainId = token.chainId as number
      const publicClient = isL2NetworkId(chainId)
        ? hemiClient
        : getEvmL1PublicClient(chainId)

      return {
        queryFn: () =>
          isConnected
            ? isNativeToken(token)
              ? publicClient.getBalance({ address: account })
              : // @ts-expect-error because it works on IDE
                getErc20TokenBalance(publicClient, {
                  account,
                  address: token.address as `0x${string}`,
                })
            : BigInt(0),
        queryKey: ['top-token-balance', token.chainId, token.address],
        select: (balance: bigint) => ({ ...token, balance }),
      }
    }),
  })
}
