import { TotalDepositsIcon } from 'components/icons/totalDepositsIcon'
import { StatCard } from 'components/statCard'
import { useTranslations } from 'use-intl'
import { formatFiatNumber } from 'utils/format'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

import { useTotalDeposits } from '../_hooks/useTotalDeposits'

import { FromPoolsBadge } from './fromPoolsBadge'

export const StakedBalance = function () {
  const { data, isError, isPending } = useTotalDeposits()
  const { status } = useAccount()
  const t = useTranslations('hemi-earn')
  const isDisconnected = !walletIsConnected(status)
  const hasError = isError || isDisconnected

  return (
    <StatCard
      badge={isPending ? undefined : <FromPoolsBadge />}
      icon={<TotalDepositsIcon />}
      isError={hasError}
      isLoading={isPending}
      label={t('info.staked-balance')}
      value={<>${formatFiatNumber(data?.totalUsd ?? 0)}</>}
    />
  )
}
