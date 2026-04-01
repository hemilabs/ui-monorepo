'use client'

import { useTranslations } from 'next-intl'

import { useTotalAvgApy } from '../_hooks/useTotalAvgApy'
import { AvgApyIcon } from '../_icons/avgApyIcon'
import { formatApyDisplay } from '../_utils'

import { EarnCard } from './earnCard'
import { VaultBreakdownTooltip } from './vaultBreakdownTooltip'

export const TotalAvgApy = function () {
  const { data, isError, isPending } = useTotalAvgApy()
  const t = useTranslations('hemi-earn')

  const tooltipContent =
    data && data.vaultBreakdown.length > 0 ? (
      <VaultBreakdownTooltip vaultBreakdown={data.vaultBreakdown} />
    ) : undefined

  return (
    <EarnCard
      icon={<AvgApyIcon />}
      isError={isError}
      isLoading={isPending}
      label={t('info.total-apy')}
      subtitle={t('info.across-vaults', { count: data?.vaultCount ?? 0 })}
      tooltipContent={tooltipContent}
      value={<>{formatApyDisplay(data?.apy ?? 0)}</>}
    />
  )
}
