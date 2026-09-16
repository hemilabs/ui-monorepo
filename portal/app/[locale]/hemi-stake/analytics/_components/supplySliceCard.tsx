import { useLocale, useTranslations } from 'use-intl'
import { formatPercentage } from 'utils/format'
import { isDataUnavailable } from 'utils/queryStatus'

import { StakeStatCard } from '../../_components/stakeStatCard'
import { StatBadge } from '../../_components/statBadge'
import { useSupplySlice } from '../_hooks/useSupplyStat'
import { formatSupplyValue } from '../_utils/formatSupplyValue'
import { sliceColors } from '../_utils/sliceColors'
import {
  sliceLabels,
  type SupplyPeriod,
  type SupplySlice,
  type SupplyUnit,
} from '../_utils/supplyHistory'

import { ChangeIndicator } from './changeIndicator'

type Props = {
  period: SupplyPeriod
  slice: SupplySlice
  symbol: string
  unit: SupplyUnit
}

export const SupplySliceCard = function ({
  period,
  slice,
  symbol,
  unit,
}: Props) {
  const locale = useLocale()
  const t = useTranslations('hemi-stake.analytics')
  const { data, fetchStatus, isPending, status } = useSupplySlice({
    period,
    slice,
    unit,
  })

  const isUnavailable = isDataUnavailable({ fetchStatus, status })

  return (
    <StakeStatCard
      badge={
        data === undefined ? undefined : (
          <StatBadge>
            <span>
              {t('share-of-supply', {
                share: formatPercentage(data.share * 100),
              })}
            </span>
            <span aria-hidden>·</span>
            <ChangeIndicator isUp={data.change >= 0}>
              {formatSupplyValue({
                locale,
                symbol,
                unit,
                value: Math.abs(data.change),
              })}
            </ChangeIndicator>
          </StatBadge>
        )
      }
      isError={isUnavailable && data === undefined}
      isLoading={isPending && !isUnavailable}
      label={
        <span className="flex items-center gap-x-1.5">
          <span
            className="size-2 shrink-0 rounded-sm"
            style={{ backgroundColor: sliceColors[slice] }}
          />
          {t(sliceLabels[slice])}
        </span>
      }
      value={
        data === undefined
          ? '-'
          : formatSupplyValue({ locale, symbol, unit, value: data.value })
      }
    />
  )
}
