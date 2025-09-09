import { useQueries } from '@tanstack/react-query'
import { useHemiClient } from 'hooks/useHemiClient'
import { useStakeTokens } from 'hooks/useStakeTokens'
import { StakeToken } from 'types/stake'
import { getTokenBalance } from 'utils/getTokenBalance'
import { useAccount } from 'wagmi'

export const useWalletBalances = function () {
  const { address: account } = useAccount()
  const hemiClient = useHemiClient()
  const stakeTokens = useStakeTokens()

  return useQueries({
    combine: results => ({
      loading: results.some(({ isLoading }) => isLoading),
      tokensWalletBalance: results
        .filter(
          (result): result is typeof result & { data: StakeToken } =>
            result.status === 'success' && result.data !== undefined,
        )
        .map(({ data }) => data),
    }),
    queries: stakeTokens.map(token => ({
      queryFn: () =>
        getTokenBalance({
          account,
          client: hemiClient,
          token,
        }),
      queryKey: ['wallet-token-balance', token.chainId, token.address],
      // refetch every 5 minutes
      refetchInterval: 5 * 60 * 1000,
      select: (balance: bigint) => ({ ...token, balance }) satisfies StakeToken,
    })),
  })
}
