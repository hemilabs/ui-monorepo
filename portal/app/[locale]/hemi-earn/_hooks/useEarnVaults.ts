import { useQueries, useQuery } from '@tanstack/react-query'
import { useNetworkType } from 'hooks/useNetworkType'

import { isVaultListed } from '../_utils/vaults'
import { type EarnVault } from '../types'

import { earnApyQueryOptions, selectApyValue } from './useEarnApy'
import { earnTvlQueryOptions } from './useEarnTvl'
import { useHemiEarnShares } from './useHemiEarnShares'

// Combines the shares registry with independent TVL (per-share) and APY (one shared call) queries, each with its own freshness.
export const useEarnVaults = function () {
  const [networkType] = useNetworkType()
  const { data: shares, isError, isPending } = useHemiEarnShares()

  // TVL is deliberately out of isPending: the page renders immediately and each cell shows its own skeleton via totalDepositsStatus.
  const tvlQueries = useQueries({
    queries: (shares ?? []).map(share =>
      earnTvlQueryOptions({ networkType, stakingVault: share.stakingVault }),
    ),
  })

  const { data: apyByVault, isPending: isApyPending } = useQuery(
    earnApyQueryOptions(),
  )

  const data: EarnVault[] | undefined = shares?.map((share, index) => ({
    apy: selectApyValue(apyByVault, isApyPending, share.stakingVault),
    assets: share.assets,
    exposureTokens: share.assets.map(a => ({
      address: a.address,
      chainId: a.token.chainId,
    })),
    isListed: isVaultListed(share.stakingVault),
    peggedToken: share.peggedToken,
    shareAddress: share.shareAddress,
    shareToken: share.shareToken,
    stakingVault: share.stakingVault,
    totalDeposits: tvlQueries[index]?.data,
    totalDepositsStatus: tvlQueries[index]?.status ?? 'pending',
  }))

  return { data, isError, isPending }
}
