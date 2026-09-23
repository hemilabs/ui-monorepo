import { Badge } from 'components/badge'
import { RenderFiatBalance } from 'components/fiatBalance'
import { WalletIcon } from 'components/icons/walletIcon'
import { StatBadgeSkeleton } from 'components/statBadgeSkeleton'
import { StatCard } from 'components/statCard'
import { useHemiToken } from 'hooks/useHemiToken'
import { useLocale, useTranslations } from 'use-intl'
import { formatCompactFiat, formatCompactFiatParts } from 'utils/format'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'

import { useStakingPositions } from '../_hooks/useStakingPositions'
import { sumActiveStake } from '../_utils/walletStakedTotal'

export const WalletStaked = function () {
  const locale = useLocale()
  const t = useTranslations('hemi-stake.stats')
  const token = useHemiToken()
  const { address } = useAccount()
  const { data, fetchStatus, status } = useStakingPositions()

  const staked = sumActiveStake(data ?? [], address)
  const isLoading = status === 'pending'
  const isError = status === 'error'

  const { number, suffix } = formatCompactFiatParts(
    Number(formatUnits(staked, token.decimals)),
    locale,
  )

  const formatBadge = (amount: string) =>
    Number(amount) > 0 ? formatCompactFiat(Number(amount), locale, 2) : '-'

  return (
    <StatCard
      badge={
        isError ? undefined : isLoading ? (
          <StatBadgeSkeleton size="xSmall" />
        ) : (
          <Badge size="small" variant="secondary">
            <RenderFiatBalance
              balance={staked}
              customFormatter={formatBadge}
              fetchStatus={fetchStatus}
              queryStatus={status}
              token={token}
            />
          </Badge>
        )
      }
      icon={<WalletIcon height={14} width={17} />}
      isError={isError}
      isLoading={isLoading}
      label={t('your-staked')}
      value={`${number}${suffix} ${token.symbol}`}
    />
  )
}
