'use client'

import { useTranslations } from 'next-intl'
import { formatFiatNumber } from 'utils/format'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

import { useTotalDeposits } from '../_hooks/useTotalDeposits'
import { TotalDepositsIcon } from '../_icons/totalDepositsIcon'

import { EarnCard } from './earnCard'
import { VaultBreakdownTooltip } from './vaultBreakdownTooltip'

export const TotalDeposits = function () {
  const { data, isError, isPending } = useTotalDeposits()
  const { status } = useAccount()
  const t = useTranslations('hemi-earn')
  const isDisconnected = !walletIsConnected(status)

  const tooltipContent =
    data && data.vaultBreakdown.length > 0 ? (
      <VaultBreakdownTooltip vaultBreakdown={data.vaultBreakdown} />
    ) : undefined

  return (
    <EarnCard
      icon={<TotalDepositsIcon />}
      isError={isError || isDisconnected}
      isLoading={isPending}
      label={t('info.total-deposits')}
      subtitle={t('info.across-vaults', { count: data?.vaultCount ?? 0 })}
      tooltipContent={tooltipContent}
      value={<>${formatFiatNumber(data?.totalUsd ?? 0)}</>}
    />
  )
}
