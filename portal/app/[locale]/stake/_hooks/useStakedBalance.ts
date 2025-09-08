import { useQueries, useQuery } from '@tanstack/react-query'
import { HemiPublicClient, useHemiClient } from 'hooks/useHemiClient'
import { NetworkType, useNetworkType } from 'hooks/useNetworkType'
import { useStakeTokens } from 'hooks/useStakeTokens'
import { StakeToken } from 'types/stake'
import { isNativeToken } from 'utils/nativeToken'
import { getWrappedEther } from 'utils/token'
import { Address } from 'viem'
import { useAccount } from 'wagmi'

export const getStakedBalanceQueryKey = ({
  address,
  networkType,
  token,
}: {
  address: Address | undefined
  networkType: NetworkType
  token: StakeToken
}) => [
  'staked-token-balance',
  address,
  networkType,
  token.chainId,
  token.address,
]

const getStakedBalance = ({
  address,
  hemiClient,
  token,
}: {
  address: Address
  hemiClient: HemiPublicClient
  token: StakeToken
}) =>
  function () {
    if (!hemiClient) {
      return Promise.resolve(BigInt(0))
    }
    return hemiClient.stakedBalance({
      address,
      // @ts-expect-error tokenAddress is a string Address
      tokenAddress: isNativeToken(token)
        ? getWrappedEther(token.chainId).address
        : token.address,
    })
  }

const getQuery = ({
  address,
  hemiClient,
  isConnected,
  networkType,
  token,
}: {
  address: Address | undefined
  hemiClient: HemiPublicClient
  isConnected: boolean
  networkType: NetworkType
  token: StakeToken
}) => ({
  enabled: isConnected && !!address,
  queryFn: getStakedBalance({ address: address!, hemiClient, token }),
  queryKey: getStakedBalanceQueryKey({ address, networkType, token }),
})

export const useStakedBalance = function (token: StakeToken) {
  const { address, isConnected } = useAccount()
  const hemiClient = useHemiClient()
  const [networkType] = useNetworkType()

  const { data: balance = BigInt(0), ...rest } = useQuery(
    getQuery({
      address,
      hemiClient,
      isConnected,
      networkType,
      token,
    }),
  )
  return {
    balance,
    ...rest,
  }
}

export const useStakePositions = function () {
  const { address, isConnected } = useAccount()
  const hemiClient = useHemiClient()
  const [networkType] = useNetworkType()
  const stakeTokens = useStakeTokens()

  return useQueries({
    combine: results => ({
      loading: results.some(({ isLoading }) => isLoading),
      tokensWithPosition: results
        .filter(
          (result): result is typeof result & { data: StakeToken } =>
            result.status === 'success' &&
            result.data !== undefined &&
            result.data.balance > BigInt(0) &&
            // Exclude ETH, as WETH will appear already
            !isNativeToken(result.data),
        )
        .map(({ data }) => data),
    }),
    queries: stakeTokens.map(token => ({
      // By using the same query as useStakedBalance, when useStakedBalance is used, balance will be preloaded already!
      ...getQuery({
        address,
        hemiClient,
        isConnected,
        networkType,
        token,
      }),
      select: (balance: bigint) => ({ ...token, balance }) satisfies StakeToken,
    })),
  })
}
