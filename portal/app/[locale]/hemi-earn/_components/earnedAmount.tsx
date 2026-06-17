'use client'

import { useTranslations } from 'next-intl'
import { formatFiatNumber } from 'utils/format'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

import { useEarnedAmount } from '../_hooks/useEarnedAmount'
import { EarnedAmountIcon } from '../_icons/earnedAmountIcon'

import { EarnCard } from './earnCard'

export const EarnedAmount = function () {
  const { data, isError, isPending } = useEarnedAmount()
  const { status } = useAccount()
  const t = useTranslations('hemi-earn')
  const isDisconnected = !walletIsConnected(status)

  return (
    <EarnCard
      icon={<EarnedAmountIcon />}
      isError={isError || isDisconnected}
      isLoading={isPending}
      label={t('info.earned-amount')}
      value={<>${formatFiatNumber(data?.totalUsd ?? 0)}</>}
    />
  )
}
