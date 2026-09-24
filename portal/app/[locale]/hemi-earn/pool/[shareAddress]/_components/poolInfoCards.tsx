import { ArrowGrowingIcon } from 'components/icons/arrowGrowingIcon'
import { TotalDepositsIcon } from 'components/icons/totalDepositsIcon'
import { StatCard } from 'components/statCard'
import { useTranslations } from 'use-intl'
import { formatFiatNumber } from 'utils/format'

import { RenderEarnFiatBalance } from '../../../_components/earnFiatBalance'
import { formatApyDisplay } from '../../../_utils/formatApy'
import { type EarnPool } from '../../../types'

type Props = {
  pool: EarnPool
}

export const PoolInfoCards = function ({ pool }: Props) {
  const t = useTranslations('hemi-earn')

  return (
    <div className="flex w-full flex-col items-stretch gap-4 sm:flex-row md:gap-5">
      <div className="flex-1">
        <StatCard
          icon={<TotalDepositsIcon />}
          isError={false}
          isLoading={false}
          label={t('pool.total-deposits')}
          value={
            <RenderEarnFiatBalance
              balance={pool.totalDeposits}
              customFormatter={usd => `$${formatFiatNumber(usd)}`}
              queryStatus={pool.totalDepositsStatus}
              token={pool.peggedToken}
            />
          }
        />
      </div>
      <div className="flex-1">
        <StatCard
          icon={<ArrowGrowingIcon />}
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
