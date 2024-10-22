import { useUmami } from 'app/analyticsEvents'
import { featureFlags } from 'app/featureFlags'
import { useNetworkType } from 'hooks/useNetworkType'
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
  const [networkType] = useNetworkType()
  const t = useTranslations('tunnel-page.transaction-history.top-bar')
  const { track } = useUmami()
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
              onClick={function () {
                onFilterOptionChange('all')
                track?.('txn filter - all', { chain: networkType })
              }}
              selected={filterOption === 'all'}
            >
              {t('all')}
            </Tab>
            <Tab
              border
              onClick={function () {
                onFilterOptionChange('ethereum')
                track?.('txn filter - eth', { chain: networkType })
              }}
              selected={filterOption === 'ethereum'}
            >
              {t('ethereum')}
            </Tab>
            <Tab
              border
              onClick={function () {
                onFilterOptionChange('bitcoin')
                track?.('txn filter - btc', { chain: networkType })
              }}
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
