'use client'

import { useTranslations } from 'next-intl'
import { formatFiatNumber } from 'utils/format'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

import { useRewards } from '../_hooks/useRewards'
import { SparkleIcon } from '../_icons/sparkleIcon'

import { EarnCard } from './earnCard'

export const Rewards = function () {
  const { data, isError, isPending } = useRewards()
  const { status } = useAccount()
  const t = useTranslations('hemi-earn')
  const isDisconnected = !walletIsConnected(status)

  return (
    <EarnCard
      icon={<SparkleIcon />}
      isError={isError || isDisconnected}
      isLoading={isPending}
      label={t('info.rewards')}
      value={<>${formatFiatNumber(data?.totalUsd ?? 0)}</>}
    />
  )
}
