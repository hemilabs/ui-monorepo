import { useTranslations } from 'use-intl'
import { formatNumber } from 'utils/format'
import { isDataUnavailable } from 'utils/queryStatus'

import { type StakeStats } from '../_fetchers/fetchStakeStats'
import { useStakeStats } from '../_hooks/useStakeStats'

import { StakeStatCard } from './stakeStatCard'

const selectWalletsStaking = (stats: StakeStats) => stats.walletsStaking

export const WalletsStaking = function () {
  const t = useTranslations('hemi-stake.stats')
  const { data, fetchStatus, isPending, status } =
    useStakeStats(selectWalletsStaking)

  const isUnavailable = isDataUnavailable({ fetchStatus, status })

  return (
    <StakeStatCard
      isError={isUnavailable && data === undefined}
      isLoading={isPending && !isUnavailable}
      label={t('wallets-staking')}
      value={formatNumber(data ?? 0)}
    />
  )
}
