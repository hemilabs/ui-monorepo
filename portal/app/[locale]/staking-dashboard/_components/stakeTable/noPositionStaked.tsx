'use client'

import { TableEmptyState } from 'components/tableEmptyState'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTranslations } from 'next-intl'

import { EmptyIcon } from '../../_icons/emptyIcon'

import { type StakeTableFilterOptions } from './stakeTableFilter'

export function NoPositionStaked({
  filter,
}: {
  filter: StakeTableFilterOptions
}) {
  const t = useTranslations('staking-dashboard.table')
  const { symbol } = useHemiToken()
  const isBurned = filter === 'withdrawn'

  const title = isBurned
    ? t('no-hemi-burned', { symbol })
    : t('no-hemi-staked', { symbol })

  const subtitle = isBurned
    ? t('get-started-burned', { symbol })
    : t('get-started', { symbol })

  return (
    <TableEmptyState
      icon={
        <div className="flex size-8 items-center justify-center rounded-full bg-orange-50">
          <EmptyIcon />
        </div>
      }
      subtitle={subtitle}
      title={title}
    />
  )
}
