import { Badge } from 'components/badge'
import { RenderFiatBalance } from 'components/fiatBalance'
import { WalletIcon } from 'components/icons/walletIcon'
import { StatBadgeSkeleton } from 'components/statBadgeSkeleton'
import { StatCard } from 'components/statCard'
import { useFormat } from 'hooks/useFormat'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTranslations } from 'use-intl'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'

import { useStakingPositions } from '../_hooks/useStakingPositions'
import { sumActiveStake } from '../_utils/walletStakedTotal'

export const WalletStaked = function () {
  const { formatCompactFiat, formatCompactFiatParts } = useFormat()
  const t = useTranslations('hemi-stake.stats')
  const token = useHemiToken()
  const { address } = useAccount()
  const { data, fetchStatus, isLoadingError, status } = useStakingPositions()

  const staked = sumActiveStake(data ?? [], address)
  const isLoading = status === 'pending'

  const { number, suffix } = formatCompactFiatParts(
    Number(formatUnits(staked, token.decimals)),
  )

  const formatBadge = (amount: string) =>
    Number(amount) > 0 ? formatCompactFiat(Number(amount), 2) : '-'

  return (
    <StatCard
      badge={
        isLoading ? (
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
      isError={isLoadingError}
      isLoading={isLoading}
      label={t('your-staked')}
      value={`${number}${suffix} ${token.symbol}`}
    />
  )
}
