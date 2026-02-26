import { useQueries } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useMemo } from 'react'
import { getPositionVotingPower } from 've-hemi-actions/actions'
import { useAccount } from 'wagmi'

import { getPositionVotingPowerQueryKey } from './usePositionVotingPower'

export const usePositionsVotingPowerSum = function (tokenIds: bigint[]) {
  const { hemiWalletClient } = useHemiWalletClient()
  const { address } = useAccount()
  const chainId = useHemi().id

  const queries = useQueries({
    queries: tokenIds.map(tokenId => ({
      enabled: !!address && !!hemiWalletClient && tokenId > BigInt(0),
      queryFn: () =>
        getPositionVotingPower({
          client: hemiWalletClient!,
          ownerAddress: address!,
          tokenId,
        }),
      queryKey: getPositionVotingPowerQueryKey({
        chainId,
        tokenId,
      }),
      refetchInterval: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    })),
  })

  const sum = useMemo(
    () =>
      tokenIds.length === 0
        ? BigInt(0)
        : queries.every(q => q.isSuccess && q.data !== undefined)
          ? queries.reduce((acc, q) => acc + (q.data ?? BigInt(0)), BigInt(0))
          : undefined,
    [queries, tokenIds.length],
  )

  const isLoading = tokenIds.length > 0 && queries.some(q => q.isLoading)
  const isError = queries.some(q => q.isError)

  return {
    data: sum,
    isError,
    isLoading,
  }
}
