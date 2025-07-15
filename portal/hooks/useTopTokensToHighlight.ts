import { useQueries } from '@tanstack/react-query'
import Big from 'big.js'
import { Token } from 'types/token'
import { isL2NetworkId } from 'utils/chain'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { isNativeToken } from 'utils/nativeToken'
import { getTokenPrice } from 'utils/token'
import { formatUnits } from 'viem'
import { getErc20TokenBalance } from 'viem-erc20/actions'
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
 * - Native and ERC-20 token balances are supported.
 * - Prices are fetched via the `useTokenPrices` hook.
 * - Balances are normalized using `formatUnits` to match the token's decimals.
 * - Values are multiplied using `Big.js` to ensure precision in the USD calculation.
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

      const sortedResults = successfulResults
        .filter(function ({ data }) {
          const price = getTokenPrice(data, prices)
          return price && data.balance > BigInt(0)
        })
        .sort(function (a, b) {
          const aStringBalance = formatUnits(a.data.balance, a.data.decimals)
          const bStringBalance = formatUnits(b.data.balance, b.data.decimals)

          const aPrice = getTokenPrice(a.data, prices)
          const bPrice = getTokenPrice(b.data, prices)

          const aAmount = Big(aStringBalance).times(Big(aPrice))
          const bAmount = Big(bStringBalance).times(Big(bPrice))

          if (aAmount.gt(bAmount)) return -1
          if (aAmount.lt(bAmount)) return 1
          return 0
        })
        .map(({ data }) => ({ ...data }))

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
