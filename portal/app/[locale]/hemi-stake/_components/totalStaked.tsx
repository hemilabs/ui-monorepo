import Big from 'big.js'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTokenPrices } from 'hooks/useTokenPrices'
import { useLocale, useTranslations } from 'use-intl'
import { formatCompactFiat, formatCompactFiatParts } from 'utils/format'
import { isDataUnavailable } from 'utils/queryStatus'
import { getTokenPrice } from 'utils/token'
import { formatUnits } from 'viem'

import { type StakeStats } from '../_fetchers/fetchStakeStats'
import { useStakeStats } from '../_hooks/useStakeStats'

import { StakeStatCard } from './stakeStatCard'
import { StatBadge } from './statBadge'

const selectTotalStaked = (stats: StakeStats) => stats.totalStaked

export const TotalStaked = function () {
  const token = useHemiToken()
  const locale = useLocale()
  const { data: prices } = useTokenPrices()
  const t = useTranslations('hemi-stake.stats')
  const { data, fetchStatus, isPending, status } =
    useStakeStats(selectTotalStaked)

  const isUnavailable = isDataUnavailable({ fetchStatus, status })

  const staked = formatUnits(BigInt(data ?? 0), token.decimals)
  const { number, suffix } = formatCompactFiatParts(Number(staked), locale)

  const quoted = getTokenPrice(token, prices)
  const usd =
    data === undefined || quoted === '0'
      ? undefined
      : Big(staked).times(quoted).toNumber()

  return (
    <StakeStatCard
      badge={
        usd === undefined ? undefined : (
          <StatBadge>{formatCompactFiat(usd, locale, 2)}</StatBadge>
        )
      }
      isError={isUnavailable && data === undefined}
      isLoading={isPending && !isUnavailable}
      label={t('total-staked')}
      value={`${number}${suffix} ${token.symbol}`}
    />
  )
}
