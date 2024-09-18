import { featureFlags } from 'app/featureFlags'
import { useTranslations } from 'next-intl'
import { Tabs, Tab } from 'ui-common/components/tabs'

import { ReloadHistory } from './reloadHistory'
import { TunnelHistorySyncStatus } from './tunnelHistorySyncStatus'

export type FilterOptions = 'all' | 'bitcoin' | 'ethereum'

type Props = {
  filterOption: FilterOptions
  onFilterOptionChange: (filter: FilterOptions) => void
}

export const TopBar = function ({ filterOption, onFilterOptionChange }: Props) {
  const t = useTranslations('tunnel-page.transaction-history.top-bar')
  return (
    <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-2 px-3.5 py-2 md:flex-nowrap md:px-3">
      <h5 className="order-1 flex-shrink-0 flex-grow basis-2/5 md:flex-grow-0 md:basis-auto">
        {t('recent-transactions')}
      </h5>
      <div className="order-3 basis-1/5 md:order-2 md:basis-auto">
        <ReloadHistory />
      </div>
      <div className="order-2 flex-grow basis-2/5 md:order-3 md:basis-auto">
        <TunnelHistorySyncStatus />
      </div>
      {featureFlags.btcTunnelEnabled && (
        <div className="order-4 ml-auto">
          <Tabs>
            <Tab
              border
              onClick={() => onFilterOptionChange('all')}
              selected={filterOption === 'all'}
            >
              {t('all')}
            </Tab>
            <Tab
              border
              onClick={() => onFilterOptionChange('ethereum')}
              selected={filterOption === 'ethereum'}
            >
              {t('ethereum')}
            </Tab>
            <Tab
              border
              onClick={() => onFilterOptionChange('bitcoin')}
              selected={filterOption === 'bitcoin'}
            >
              {t('bitcoin')}
            </Tab>
          </Tabs>
        </div>
      )}
    </div>
  )
}
