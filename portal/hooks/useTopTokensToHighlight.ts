import { useQueries } from '@tanstack/react-query'
import { EvmToken, Token } from 'types/token'
import { isL2NetworkId } from 'utils/chain'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { getTokenBalance } from 'utils/getTokenBalance'
import { sortTokens } from 'utils/sortTokens'
import { getTokenPrice } from 'utils/token'
import { useAccount } from 'wagmi'

import { useHemiClient } from './useHemiClient'
import { useTokenPrices } from './useTokenPrices'

type Props = {
  tokens: Token[]
}

/**
 * Hook to retrieve and rank the top tokens held by the user based on their USD value.
 *
 * This hook fetches the on-chain balances for a given list of tokens (on both L1 and L2),
 * retrieves their corresponding USD prices from the portal API, and returns the top tokens
 * sorted by their total USD value (balance * price).
 *
 * - Evm tokens are supported.
 * - Prices are fetched via the `useTokenPrices` hook.
 *
 * This is useful for UI components that want to highlight the user's most valuable tokens,
 * for example: Quick tokens in a token selector.
 *
 * @param tokens List of available tokens to evaluate
 * @returns Query result containing sorted tokens by USD value, loading and error states
 */
export function useTopTokensToHighlight({ tokens }: Props) {
  const { address: account, isConnected } = useAccount()
  const hemiClient = useHemiClient()
  const { data: prices } = useTokenPrices()

  return useQueries({
    combine(results) {
      if (!isConnected || !account || !prices) {
        return {
          isError: false,
          isLoading: false,
          sortedTokens: [] as Token[], // Satisfy type inference for empty fallback
        }
      }

      const successfulResults = results.filter(
        ({ data, status }) =>
          status === 'success' && typeof data?.balance === 'bigint',
      )

      const tokensWithBalance = successfulResults
        .map(({ data }) => ({ ...data }))
        .filter(function (token): token is EvmToken & { balance: bigint } {
          const price = getTokenPrice(token, prices)
          return price && token.balance > BigInt(0)
        })

      const sortedResults = sortTokens<EvmToken>({
        prices,
        tokens: tokensWithBalance,
      })

      return {
        isError: results.some(r => r.isError),
        isLoading: results.some(r => r.isLoading),
        sortedTokens: [...sortedResults],
      }
    },
    queries: tokens.map(function (token) {
      // We can safely cast here it's an evm token
      const chainId = token.chainId as number
      const client = isL2NetworkId(chainId)
        ? hemiClient
        : getEvmL1PublicClient(chainId)

      return {
        queryFn: () =>
          getTokenBalance({
            account,
            client,
            isConnected,
            token,
          }),
        queryKey: ['top-token-balance', token.chainId, token.address],
        select: (balance: bigint) => ({ ...token, balance }),
      }
    }),
  })
}
