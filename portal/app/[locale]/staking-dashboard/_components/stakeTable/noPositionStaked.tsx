'use client'

import { TableEmptyState } from 'components/tableEmptyState'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTranslations } from 'next-intl'

import { EmptyIcon } from '../../_icons/emptyIcon'

export function NoPositionStaked() {
  const t = useTranslations('staking-dashboard.table')
  const { symbol } = useHemiToken()

  return (
    <TableEmptyState
      icon={
        <div className="flex size-8 items-center justify-center rounded-full bg-orange-50">
          <EmptyIcon />
        </div>
      }
      subtitle={t('get-started', { symbol })}
      title={t('no-hemi-staked', { symbol })}
    />
  )
}
