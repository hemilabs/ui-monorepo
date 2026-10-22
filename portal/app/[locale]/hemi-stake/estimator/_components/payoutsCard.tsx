import { Badge } from 'components/badge'
import { DisplayAmount } from 'components/displayAmount'
import { RenderFiatBalance } from 'components/fiatBalance'
import { SparkleIcon } from 'components/icons/sparkleIcon'
import { StatBadgeSkeleton } from 'components/statBadgeSkeleton'
import { StatCard } from 'components/statCard'
import { useHemiToken } from 'hooks/useHemiToken'
import { useLocale, useTranslations } from 'use-intl'
import { formatCompactFiat } from 'utils/format'
import { formatUnits } from 'viem'

type Props = {
  isError: boolean
  isLoading: boolean
  yearOneTotal: bigint
}

export const PayoutsCard = function ({
  isError,
  isLoading,
  yearOneTotal,
}: Props) {
  const locale = useLocale()
  const t = useTranslations('hemi-stake.estimator')
  const token = useHemiToken()

  const formatBadge = (amount: string) =>
    Number(amount) > 0 ? formatCompactFiat(Number(amount), locale, 2) : '-'

  return (
    <StatCard
      badge={
        isLoading ? (
          <StatBadgeSkeleton size="xSmall" />
        ) : (
          <Badge size="small" variant="secondary">
            <RenderFiatBalance
              balance={yearOneTotal}
              customFormatter={formatBadge}
              queryStatus="success"
              token={token}
            />
          </Badge>
        )
      }
      icon={<SparkleIcon className="text-orange-600" />}
      isError={isError}
      isLoading={isLoading}
      label={t('estimated-payouts-first-year')}
      value={
        <DisplayAmount
          amount={formatUnits(yearOneTotal, token.decimals)}
          token={token}
        />
      }
    />
  )
}
