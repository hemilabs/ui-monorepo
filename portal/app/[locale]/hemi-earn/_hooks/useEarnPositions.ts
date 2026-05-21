'use client'

import { useQueries } from '@tanstack/react-query'
import { hemi } from 'hemi-viem'
import { useNetworkType } from 'hooks/useNetworkType'
import { getHemiClient } from 'utils/chainClients'
import { balanceOf } from 'viem-erc20/actions'
import { useAccount } from 'wagmi'

import { type EarnPosition } from '../types'

import { useHemiEarnShares } from './useHemiEarnShares'

export const earnPositionsKeyPrefix = ['hemi-earn', 'positions']

export const useEarnPositions = function () {
  const [networkType] = useNetworkType()
  const { address } = useAccount()
  const {
    data: shares = [],
    isError: isSharesError,
    isPending: isSharesPending,
  } = useHemiEarnShares()

  const balanceQueries = useQueries({
    queries: shares.map(share => ({
      enabled: !!address && shares.length > 0,
      queryFn: () =>
        balanceOf(getHemiClient(hemi.id), {
          account: address!,
          address: share.shareAddress,
        }),
      queryKey: [
        ...earnPositionsKeyPrefix,
        networkType,
        address,
        share.shareAddress,
        'shareBalance',
      ],
    })),
  })

  // Treat the shares skeleton as part of the loading lifecycle — otherwise
  // disconnected users see "no positions" while the registry is still
  // resolving, and registry errors are silently turned into an empty list.
  const isPending =
    isSharesPending ||
    (!!address &&
      shares.length > 0 &&
      balanceQueries.some(q => q.isPending && q.isFetching))
  const isError =
    isSharesError ||
    (!isPending &&
      !!address &&
      shares.length > 0 &&
      balanceQueries.every(q => q.isError))

  const data: EarnPosition[] = !address
    ? []
    : shares
        .map((share, index) => ({
          balance: balanceQueries[index]?.data ?? BigInt(0),
          share,
        }))
        .filter(({ balance }) => balance > BigInt(0))
        .map(({ balance, share }) => ({
          peggedToken: share.peggedToken,
          shareAddress: share.shareAddress,
          shareToken: share.shareToken,
          yourDeposit: balance,
        }))

  return { data, isError, isPending }
}
