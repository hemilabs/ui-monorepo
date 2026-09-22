import { RenderFiatBalance } from 'components/fiatBalance'
import { WalletIcon } from 'components/icons/walletIcon'
import { useHemiToken } from 'hooks/useHemiToken'
import { useLocale, useTranslations } from 'use-intl'
import { formatCompactFiat, formatCompactFiatParts } from 'utils/format'
import { formatUnits } from 'viem'

import { useStakingPositions } from '../_hooks/useStakingPositions'
import { sumActiveStake } from '../_utils/walletStakedTotal'

import { StakeStatCard } from './stakeStatCard'
import { StatBadge, StatBadgeSkeleton } from './statBadge'

export const WalletStaked = function () {
  const locale = useLocale()
  const t = useTranslations('hemi-stake.stats')
  const token = useHemiToken()
  const { data, fetchStatus, status } = useStakingPositions()

  const staked = sumActiveStake(data ?? [])
  const isLoading = status === 'pending'
  const isError = status === 'error'

  const { number, suffix } = formatCompactFiatParts(
    Number(formatUnits(staked, token.decimals)),
    locale,
  )

  const formatBadge = (amount: string) =>
    Number(amount) > 0 ? formatCompactFiat(Number(amount), locale, 2) : '-'

  return (
    <StakeStatCard
      badge={
        isError ? undefined : isLoading ? (
          <StatBadgeSkeleton size="xSmall" />
        ) : (
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
      icon={<WalletIcon />}
      isError={isError}
      isLoading={isLoading}
      label={t('your-staked')}
      value={`${number}${suffix} ${token.symbol}`}
    />
  )
}
