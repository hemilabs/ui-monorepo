import { Tab, Tabs } from 'components/tabs'
import { useUmami } from 'hooks/useUmami'
import { StakingPositionStatus } from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'

export type StakeTableFilterOptions = StakingPositionStatus

type Props = {
  filter: StakeTableFilterOptions
  onFilter: (filter: StakeTableFilterOptions) => void
}

export function StakeTableFilter({ filter, onFilter }: Props) {
  const t = useTranslations('hemi-stake.table')
  const { track } = useUmami()

  return (
    <Tabs>
      <Tab
        onClick={function () {
          onFilter('active')
          track?.('hemi stake - filter active')
        }}
        selected={filter === 'active'}
      >
        {t('active')}
      </Tab>
      <Tab
        onClick={function () {
          onFilter('withdrawn')
          track?.('hemi stake - filter burned')
        }}
        selected={filter === 'withdrawn'}
      >
        {t('burned')}
      </Tab>
    </Tabs>
  )
}
