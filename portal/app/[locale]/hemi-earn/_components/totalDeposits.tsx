'use client'

import { useTranslations } from 'next-intl'
import { formatFiatNumber } from 'utils/format'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

import { useTotalDeposits } from '../_hooks/useTotalDeposits'
import { TotalDepositsIcon } from '../_icons/totalDepositsIcon'

import { EarnCard } from './earnCard'
import { PoolBreakdownTooltip } from './poolBreakdownTooltip'

export const TotalDeposits = function () {
  const { data, isError, isPending } = useTotalDeposits()
  const { status } = useAccount()
  const t = useTranslations('hemi-earn')
  const isDisconnected = !walletIsConnected(status)

  const tooltipContent =
    data && data.poolBreakdown.length > 0 ? (
      <PoolBreakdownTooltip poolBreakdown={data.poolBreakdown} />
    ) : undefined

  return (
    <EarnCard
      icon={<TotalDepositsIcon />}
      isError={isError || isDisconnected}
      isLoading={isPending}
      label={t('info.total-deposits')}
      subtitle={t('info.across-pools', { count: data?.poolCount ?? 0 })}
      tooltipContent={tooltipContent}
      value={<>${formatFiatNumber(data?.totalUsd ?? 0)}</>}
    />
  )
}
