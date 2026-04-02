'use client'

import { RenderFiatBalance } from 'components/fiatBalance'
import { useTranslations } from 'next-intl'
import { formatFiatNumber } from 'utils/format'

import { AvgApyIcon } from '../../../_icons/avgApyIcon'
import { TotalDepositsIcon } from '../../../_icons/totalDepositsIcon'
import { formatApyDisplay } from '../../../_utils'
import { type EarnPool } from '../../../types'

import { VaultCard } from './vaultCard'

type Props = {
  pool: EarnPool
}

export const VaultInfoCards = function ({ pool }: Props) {
  const t = useTranslations('hemi-earn')

  return (
    <div className="xs:flex-row flex w-full flex-col items-stretch gap-4 md:gap-5">
      <div className="flex-1">
        <VaultCard
          icon={<TotalDepositsIcon />}
          isError={false}
          isLoading={false}
          label={t('vault.total-deposits')}
          value={
            <RenderFiatBalance
              balance={pool.totalDeposits}
              customFormatter={usd => `$${formatFiatNumber(usd)}`}
              queryStatus="success"
              token={pool.token}
            />
          }
        />
      </div>
      <div className="flex-1">
        <VaultCard
          icon={<AvgApyIcon />}
          isError={false}
          isLoading={false}
          label={t('vault.apy')}
          value={<>{formatApyDisplay(pool.apy.total)}</>}
        />
      </div>
    </div>
  )
}
