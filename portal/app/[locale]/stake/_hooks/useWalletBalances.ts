import { useQueries } from '@tanstack/react-query'
import { useHemiClient } from 'hooks/useHemiClient'
import { useStakeTokens } from 'hooks/useStakeTokens'
import { StakeToken } from 'types/stake'
import { isNativeToken } from 'utils/nativeToken'
import { useAccount } from 'wagmi'

export const useWalletBalances = function () {
  const { address: account, isConnected } = useAccount()
  const hemiClient = useHemiClient()
  const stakeTokens = useStakeTokens()

  return useQueries({
    combine: results => ({
      loading: results.some(({ isLoading }) => isLoading),
      tokensWalletBalance: results.map(({ data }) => data),
    }),
    queries: stakeTokens.map(token => ({
      async queryFn() {
        if (!isConnected) {
          return BigInt(0)
        }
        const promise = isNativeToken(token)
          ? hemiClient.getBalance({ address: account })
          : hemiClient.getErc20TokenBalance({
              account,
              address: token.address as `0x${string}`,
            })
        return promise.catch(() => BigInt(0))
      },
      queryKey: ['wallet-token-balance', token.chainId, token.address],
      // refetch every 5 minutes
      refetchInterval: 5 * 60 * 1000,
      select: (balance: bigint) => ({ ...token, balance }) satisfies StakeToken,
    })),
  })
}
