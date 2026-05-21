'use client'

import { RenderFiatBalance } from 'components/fiatBalance'
import { useTranslations } from 'next-intl'
import { formatFiatNumber } from 'utils/format'

import { AvgApyIcon } from '../../../_icons/avgApyIcon'
import { TotalDepositsIcon } from '../../../_icons/totalDepositsIcon'
import { formatApyDisplay } from '../../../_utils'
import { type EarnPool } from '../../../types'

import { PoolCard } from './poolCard'

type Props = {
  pool: EarnPool
}

export const PoolInfoCards = function ({ pool }: Props) {
  const t = useTranslations('hemi-earn')

  return (
    <div className="flex w-full flex-col items-stretch gap-4 sm:flex-row md:gap-5">
      <div className="flex-1">
        <PoolCard
          icon={<TotalDepositsIcon />}
          isError={false}
          isLoading={false}
          label={t('pool.total-deposits')}
          value={
            <RenderFiatBalance
              balance={pool.totalDeposits}
              customFormatter={usd => `$${formatFiatNumber(usd)}`}
              queryStatus="success"
              token={pool.peggedToken}
            />
          }
        />
      </div>
      <div className="flex-1">
        <PoolCard
          icon={<AvgApyIcon />}
          isError={pool.apy === null}
          isLoading={pool.apy === undefined}
          label={t('pool.apy')}
          value={
            typeof pool.apy === 'number' ? formatApyDisplay(pool.apy) : null
          }
        />
      </div>
    </div>
  )
}
