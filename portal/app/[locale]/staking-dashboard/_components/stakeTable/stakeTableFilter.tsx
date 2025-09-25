'use client'

import { Tab, Tabs } from 'components/tabs'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'
import { StakingPositionStatus } from 'types/stakingDashboard'

export type StakeTableFilterOptions = StakingPositionStatus

type Props = {
  filter: StakeTableFilterOptions
  onFilter: (filter: StakeTableFilterOptions) => void
}

export function StakeTableFilter({ filter, onFilter }: Props) {
  const t = useTranslations('staking-dashboard.table')
  const { track } = useUmami()

  return (
    <Tabs>
      <Tab
        onClick={function () {
          onFilter('active')
          track?.('staking dashboard - filter active')
        }}
        selected={filter === 'active'}
      >
        {t('active')}
      </Tab>
      <Tab
        onClick={function () {
          onFilter('withdrawn')
          track?.('staking dashboard - filter burned')
        }}
        selected={filter === 'withdrawn'}
      >
        {t('burned')}
      </Tab>
    </Tabs>
  )
}
