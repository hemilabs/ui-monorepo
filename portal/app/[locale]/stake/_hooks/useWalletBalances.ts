import { useQueries } from '@tanstack/react-query'
import { useHemiClient } from 'hooks/useHemiClient'
import { useStakeTokens } from 'hooks/useStakeTokens'
import { StakeToken } from 'types/stake'
import { useAccount } from 'wagmi'

export const useWalletBalances = function () {
  const { address: account, isConnected } = useAccount()
  const hemiClient = useHemiClient()
  const stakeTokens = useStakeTokens()

  return useQueries({
    combine: results => ({
      loading: results.some(({ isLoading }) => isLoading),
      tokensWalletBalance: results
        .filter(({ status }) => status === 'success')
        .map(({ data }) => data),
    }),
    queries: stakeTokens.map(token => ({
      queryFn: async () =>
        isConnected
          ? hemiClient.getErc20TokenBalance({
              account,
              address: token.address as `0x${string}`,
            })
          : 0,
      queryKey: ['wallet-token-balance', token.chainId, token.address],
      select: (balance: bigint) => ({ ...token, balance }) satisfies StakeToken,
    })),
  })
}
