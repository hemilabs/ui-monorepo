import { useQueries } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { getUseTokenQueryKey } from 'hooks/useToken'
import { useMemo } from 'react'
import { EvmToken } from 'types/token'
import { getErc20Token, getTokenByAddress } from 'utils/token'
import type { Address } from 'viem'
import { useConfig } from 'wagmi'

import { useRewardTokensAddresses as useRewardTokensQuery } from './useRewardTokensAddresses'

export const useRewardTokens = function () {
  const { id } = useHemi()
  const config = useConfig()
  const {
    data: rewardTokenAddresses = [],
    isLoading: isLoadingTokenAddresses,
  } = useRewardTokensQuery()

  const tokenQueries = useQueries({
    queries: rewardTokenAddresses.map((address: Address) => ({
      enabled: !!address,
      queryFn: async () =>
        getTokenByAddress(address, id) ??
        getErc20Token({ address, chainId: id, config }),
      queryKey: getUseTokenQueryKey(address, id),
    })),
  })

  const isLoading =
    isLoadingTokenAddresses || tokenQueries.some(query => query.isLoading)

  const hasError = tokenQueries.some(query => query.isError)

  const errors = tokenQueries
    .filter(query => query.isError)
    .map(query => query.error)

  const tokens = useMemo(
    () =>
      tokenQueries
        .map(query => query.data)
        .filter((t): t is EvmToken => t !== undefined),
    [tokenQueries],
  )

  return { errors, hasError, isLoading, tokens }
}
