import { DurationTime } from 'components/durationTime'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { StakingPositionStatus } from 'types/stakingDashboard'
import { formatNumber } from 'utils/format'

import { useCalculateApr } from '../../_hooks/useCalculateApr'

type Props = {
  lockupTime: bigint
  status: StakingPositionStatus
  tokenId: string
}

export const LockupTime = function ({ lockupTime, status, tokenId }: Props) {
  const t = useTranslations('staking-dashboard.table')
  const seconds = Number(lockupTime)
  const isActive = status === 'active'

  const {
    data: apr,
    error: error,
    isLoading: isLoading,
  } = useCalculateApr({ enabled: isActive, tokenId: BigInt(tokenId) })

  const renderApr = function () {
    if (isLoading) {
      return <Skeleton className="h-4 w-16" />
    }

    if (error || apr === undefined) {
      return <span className="text-xs font-normal text-neutral-500">-</span>
    }

    return (
      <span className="text-xs font-normal text-emerald-600">
        {t('apr', { percentage: formatNumber(apr) })}
      </span>
    )
  }

  return (
    <div className="flex flex-col">
      <span className="text-neutral-500">
        <DurationTime seconds={seconds} />
      </span>
      {renderApr()}
    </div>
  )
}
