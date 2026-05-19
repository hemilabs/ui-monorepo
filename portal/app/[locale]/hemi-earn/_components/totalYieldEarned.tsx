'use client'

import { useTranslations } from 'next-intl'
import { formatFiatNumber } from 'utils/format'

import { useTotalYieldEarned } from '../_hooks/useTotalYieldEarned'
import { TotalYieldEarnedIcon } from '../_icons/totalYieldEarnedIcon'

import { EarnCard } from './earnCard'
import { PoolBreakdownTooltip } from './poolBreakdownTooltip'

export const TotalYieldEarned = function () {
  const { data, isError, isPending } = useTotalYieldEarned()
  const t = useTranslations('hemi-earn')

  const tooltipContent =
    data && data.poolBreakdown.length > 0 ? (
      <PoolBreakdownTooltip poolBreakdown={data.poolBreakdown} />
    ) : undefined

  return (
    <EarnCard
      icon={<TotalYieldEarnedIcon />}
      isError={isError}
      isLoading={isPending}
      label={t('info.total-yield')}
      subtitle={t('info.across-pools', { count: data?.poolCount ?? 0 })}
      tooltipContent={tooltipContent}
      value={<>${formatFiatNumber(data?.totalUsd ?? 0)}</>}
    />
  )
}
