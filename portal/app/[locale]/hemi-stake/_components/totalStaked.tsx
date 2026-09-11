import { useHemiToken } from 'hooks/useHemiToken'
import { useLocale, useTranslations } from 'use-intl'
import { formatCompactFiatParts } from 'utils/format'
import { isDataUnavailable } from 'utils/queryStatus'
import { formatUnits } from 'viem'

import { type StakeStats } from '../_fetchers/fetchStakeStats'
import { useStakeStats } from '../_hooks/useStakeStats'

import { StakeStatCard } from './stakeStatCard'

const selectTotalStaked = (stats: StakeStats) => stats.totalStaked

export const TotalStaked = function () {
  const { decimals, symbol } = useHemiToken()
  const locale = useLocale()
  const t = useTranslations('hemi-stake.stats')
  const { data, fetchStatus, isPending, status } =
    useStakeStats(selectTotalStaked)

  const isUnavailable = isDataUnavailable({ fetchStatus, status })

  const { number, suffix } = formatCompactFiatParts(
    Number(formatUnits(BigInt(data ?? 0), decimals)),
    locale,
  )

  return (
    <StakeStatCard
      isError={isUnavailable && data === undefined}
      isLoading={isPending && !isUnavailable}
      label={t('total-staked')}
      value={`${number}${suffix} ${symbol}`}
    />
  )
}
