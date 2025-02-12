import { useQueries, useQuery, UseQueryResult } from '@tanstack/react-query'
import { HemiPublicClient, useHemiClient } from 'hooks/useHemiClient'
import { NetworkType, useNetworkType } from 'hooks/useNetworkType'
import { useStakeTokens } from 'hooks/useStakeTokens'
import { StakeToken } from 'types/stake'
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
      tokenAddress: token.address,
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

const combine = (results: UseQueryResult<bigint, Error>[]) => ({
  hasPositions: results.some(({ data }) => data > BigInt(0)),
  loading: results.some(({ isPending }) => isPending),
})

export const useUserHasPositions = function () {
  const { address, isConnected } = useAccount()
  const hemiClient = useHemiClient()
  const [networkType] = useNetworkType()
  const stakeTokens = useStakeTokens()

  return useQueries({
    combine,
    queries: stakeTokens.map(token =>
      // By using the same query as useStakedBalance, when useStakedBalance is used, balance will be preloaded already!
      getQuery({
        address,
        hemiClient,
        isConnected,
        networkType,
        token,
      }),
    ),
  })
}
