import { featureFlags } from 'app/featureFlags'
import { useTranslations } from 'next-intl'

import { ReloadHistory } from './reloadHistory'
import { TunnelHistorySyncStatus } from './tunnelHistorySyncStatus'

export type FilterOptions = 'all' | 'bitcoin' | 'ethereum'

const SwitchButton = ({
  onClick,
  selected,
  text,
}: {
  onClick: () => void
  selected: boolean
  text: string
}) => (
  <button
    className={`
    cursor-pointer rounded-md border border-solid border-neutral-300/55 px-2 py-1
    ${
      selected ? 'bg-white text-neutral-950' : 'bg-neutral-100 text-neutral-600'
    }
  `}
    onClick={onClick}
    type="button"
  >
    {text}
  </button>
)

type Props = {
  filterOption: FilterOptions
  onFilterOptionChange: (filter: FilterOptions) => void
}

export const TopBar = function ({ filterOption, onFilterOptionChange }: Props) {
  const t = useTranslations('tunnel-page.transaction-history.top-bar')
  return (
    <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-2 px-3.5 py-2 md:flex-nowrap md:px-3">
      <span className="order-1 flex-shrink-0 flex-grow basis-2/5 md:flex-grow-0 md:basis-auto">
        {t('recent-transactions')}
      </span>
      <div className="order-3 basis-1/5 md:order-2 md:basis-auto">
        <ReloadHistory />
      </div>
      <div className="order-2 flex-grow basis-2/5 md:order-3 md:basis-auto">
        <TunnelHistorySyncStatus />
      </div>
      {featureFlags.btcTunnelEnabled && (
        <>
          <div className="order-4 ml-auto">
            <SwitchButton
              onClick={() => onFilterOptionChange('all')}
              selected={filterOption === 'all'}
              text={t('all')}
            />
          </div>
          <div className="order-5">
            <SwitchButton
              onClick={() => onFilterOptionChange('ethereum')}
              selected={filterOption === 'ethereum'}
              text={t('ethereum')}
            />
          </div>
          <div className="order-6">
            <SwitchButton
              onClick={() => onFilterOptionChange('bitcoin')}
              selected={filterOption === 'bitcoin'}
              text={t('bitcoin')}
            />
          </div>
        </>
      )}
    </div>
  )
}
