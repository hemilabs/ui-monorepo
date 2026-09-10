import { Tab, Tabs } from 'components/tabs'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'use-intl'

import { ReloadHistory } from './reloadHistory'

export type FilterOptions = {
  action: 'all' | 'pending'
  timeDesc: boolean
  type: 'all' | 'withdrawals' | 'deposits'
  operation: 'all' | 'bitcoin' | 'ethereum'
}

type Props = {
  filterOption: FilterOptions
  onFilterOptionChange: (filter: FilterOptions) => void
}

export const TopBar = function ({ filterOption, onFilterOptionChange }: Props) {
  const t = useTranslations('tunnel-page.transaction-history.top-bar')
  const { track } = useUmami()
  return (
    <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-2 md:flex-nowrap">
      <ReloadHistory />
      <div className="ml-auto">
        <Tabs>
          <Tab
            onClick={function () {
              onFilterOptionChange({ ...filterOption, operation: 'all' })
              track?.('txn filter - all')
            }}
            selected={filterOption.operation === 'all'}
          >
            {t('all')}
          </Tab>
          <Tab
            onClick={function () {
              onFilterOptionChange({ ...filterOption, operation: 'ethereum' })
              track?.('txn filter - eth')
            }}
            selected={filterOption.operation === 'ethereum'}
          >
            {t('ethereum')}
          </Tab>
          <Tab
            onClick={function () {
              onFilterOptionChange({ ...filterOption, operation: 'bitcoin' })
              track?.('txn filter - btc')
            }}
            selected={filterOption.operation === 'bitcoin'}
          >
            {t('bitcoin')}
          </Tab>
        </Tabs>
      </div>
    </div>
  )
}
