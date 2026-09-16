import { useLocale, useTranslations } from 'use-intl'
import { formatPercentage, formatTokenPrice } from 'utils/format'
import { isDataUnavailable } from 'utils/queryStatus'

import { StakeStatCard } from '../../_components/stakeStatCard'
import { StatBadge } from '../../_components/statBadge'
import { useSupplyPrice } from '../_hooks/useSupplyStat'
import { type SupplyPeriod } from '../_utils/supplyHistory'

import { ChangeIndicator } from './changeIndicator'

export const HemiPriceCard = function ({ period }: { period: SupplyPeriod }) {
  const locale = useLocale()
  const t = useTranslations('hemi-stake.analytics')
  const { data, fetchStatus, isPending, status } = useSupplyPrice({ period })

  const isUnavailable = isDataUnavailable({ fetchStatus, status })

  return (
    <StakeStatCard
      badge={
        data === undefined ? undefined : (
          <StatBadge>
            <ChangeIndicator isUp={data.change >= 0}>
              {formatPercentage(Math.abs(data.change) * 100)}
            </ChangeIndicator>
          </StatBadge>
        )
      }
      isError={isUnavailable && data === undefined}
      isLoading={isPending && !isUnavailable}
      label={t('hemi-price')}
      value={data === undefined ? '-' : formatTokenPrice(data.value, locale)}
    />
  )
}
