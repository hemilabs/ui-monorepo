import { RenderFiatBalance } from 'components/fiatBalance'
import { useHemiToken } from 'hooks/useHemiToken'
import { useLocale, useTranslations } from 'use-intl'
import { formatCompactFiat, formatCompactFiatParts } from 'utils/format'
import { isDataUnavailable } from 'utils/queryStatus'
import { formatUnits } from 'viem'

import { type StakeStats } from '../_fetchers/fetchStakeStats'
import { useStakeStats } from '../_hooks/useStakeStats'

import { StakeStatCard } from './stakeStatCard'
import { StatBadge, StatBadgeSkeleton } from './statBadge'

const selectTotalStaked = (stats: StakeStats) => stats.totalStaked

export const TotalStaked = function () {
  const token = useHemiToken()
  const locale = useLocale()
  const t = useTranslations('hemi-stake.stats')
  const { data, fetchStatus, isPending, status } =
    useStakeStats(selectTotalStaked)

  const isUnavailable = isDataUnavailable({ fetchStatus, status })

  const staked = BigInt(data ?? 0)

  const { number, suffix } = formatCompactFiatParts(
    Number(formatUnits(staked, token.decimals)),
    locale,
  )

  const formatBadge = (amount: string) =>
    Number(amount) > 0 ? formatCompactFiat(Number(amount), locale, 2) : '-'

  return (
    <StakeStatCard
      badge={
        isPending && !isUnavailable ? (
          <StatBadgeSkeleton size="xSmall" />
        ) : isUnavailable && data === undefined ? undefined : (
          <StatBadge>
            <RenderFiatBalance
              balance={staked}
              customFormatter={formatBadge}
              fetchStatus={fetchStatus}
              queryStatus={status}
              token={token}
            />
          </StatBadge>
        )
      }
      isError={isUnavailable && data === undefined}
      isLoading={isPending && !isUnavailable}
      label={t('total-staked')}
      value={`${number}${suffix} ${token.symbol}`}
    />
  )
}
