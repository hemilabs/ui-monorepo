'use client'

import { useTranslations } from 'next-intl'
import { formatFiatNumber } from 'utils/format'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

import { useTotalDeposits } from '../_hooks/useTotalDeposits'
import { TotalDepositsIcon } from '../_icons/totalDepositsIcon'

import { EarnCard } from './earnCard'

export const StakedBalance = function () {
  const { data, isError, isPending } = useTotalDeposits()
  const { status } = useAccount()
  const t = useTranslations('hemi-earn')
  const isDisconnected = !walletIsConnected(status)

  return (
    <EarnCard
      icon={<TotalDepositsIcon />}
      isError={isError || isDisconnected}
      isLoading={isPending}
      label={t('info.staked-balance')}
      value={<>${formatFiatNumber(data?.totalUsd ?? 0)}</>}
    />
  )
}
