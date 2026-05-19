'use client'

import { useTranslations } from 'next-intl'

import { useTotalAvgApy } from '../_hooks/useTotalAvgApy'
import { AvgApyIcon } from '../_icons/avgApyIcon'
import { formatApyDisplay } from '../_utils'

import { EarnCard } from './earnCard'
import { PoolBreakdownTooltip } from './poolBreakdownTooltip'

export const TotalAvgApy = function () {
  const { data, isError, isPending } = useTotalAvgApy()
  const t = useTranslations('hemi-earn')

  const tooltipContent =
    data && data.poolBreakdown.length > 0 ? (
      <PoolBreakdownTooltip poolBreakdown={data.poolBreakdown} />
    ) : undefined

  return (
    <EarnCard
      icon={<AvgApyIcon />}
      isError={isError}
      isLoading={isPending}
      label={t('info.total-apy')}
      subtitle={t('info.across-pools', { count: data?.poolCount ?? 0 })}
      tooltipContent={tooltipContent}
      value={<>{formatApyDisplay(data?.apy ?? 0)}</>}
    />
  )
}
