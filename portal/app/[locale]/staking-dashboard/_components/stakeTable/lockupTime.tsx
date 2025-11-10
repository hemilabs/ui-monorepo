import { DurationTime } from 'components/durationTime'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { formatNumber } from 'utils/format'

import { useCalculateApy } from '../../_hooks/useCalculateApy'

type Props = {
  lockupTime: bigint
  tokenId: string
}

export const LockupTime = function ({ lockupTime, tokenId }: Props) {
  const t = useTranslations('staking-dashboard.table')
  const seconds = Number(lockupTime)
  const {
    data: apy,
    error,
    isLoading,
  } = useCalculateApy({ tokenId: BigInt(tokenId) })

  const renderApy = function () {
    if (isLoading) {
      return <Skeleton className="h-4 w-16" />
    }

    if (error || apy === undefined) {
      return <span className="text-xs font-normal text-neutral-500">-</span>
    }

    return (
      <span className="text-xs font-normal text-emerald-600">
        {t('apy', { percentage: formatNumber(apy) })}
      </span>
    )
  }

  return (
    <div className="flex flex-col">
      <span className="text-neutral-500">
        <DurationTime seconds={seconds} />
      </span>
      {renderApy()}
    </div>
  )
}
