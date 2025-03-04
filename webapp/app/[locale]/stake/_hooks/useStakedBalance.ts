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
  address: Address
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
  address: Address
  hemiClient: HemiPublicClient
  isConnected: boolean
  networkType: NetworkType
  token: StakeToken
}) => ({
  enabled: isConnected && !!address,
  queryFn: getStakedBalance({ address, hemiClient, token }),
  queryKey: getStakedBalanceQueryKey({ address, networkType, token }),
})

export const useStakedBalance = function (token: StakeToken) {
  const { address, isConnected } = useAccount()
  const hemiClient = useHemiClient()
  const [networkType] = useNetworkType()

  const { data: balance, ...rest } = useQuery(
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
      loading: results.some(({ isPending }) => isPending),
      tokensWithPosition: results
        .filter(
          ({ data, status }) =>
            status === 'success' && data.balance > BigInt(0),
        )
        // Exclude ETH, as WETH will appear already
        .filter(({ data }) => !isNativeToken(data))
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
