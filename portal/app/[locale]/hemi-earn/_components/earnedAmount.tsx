import { ArrowGrowingIcon } from 'components/icons/arrowGrowingIcon'
import { StatCard } from 'components/statCard'
import { useFormat } from 'hooks/useFormat'
import { useTranslations } from 'use-intl'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

import { useEarnedAmount } from '../_hooks/useEarnedAmount'

export const EarnedAmount = function () {
  const { data, isError, isPending } = useEarnedAmount()
  const { status } = useAccount()
  const { formatFiatNumber } = useFormat()
  const t = useTranslations('hemi-earn')
  const isDisconnected = !walletIsConnected(status)

  return (
    <StatCard
      icon={<ArrowGrowingIcon />}
      isError={isError || isDisconnected}
      isLoading={isPending}
      label={t('info.estimated-earnings')}
      value={<>${formatFiatNumber(data?.totalUsd ?? 0)}</>}
    />
  )
}
