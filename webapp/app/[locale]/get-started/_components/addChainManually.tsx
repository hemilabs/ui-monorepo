import { useTranslations } from 'next-intl'
import { Chain } from 'viem'

import { ConfigurationUrl } from './configurationUrl'

type Props = {
  chain: Chain
}

const DataSection = ({ label, value }: { label: string; value: string }) => (
  <div
    className="text-ms flex flex-row flex-wrap items-center gap-x-2 gap-y-2 border-t border-solid
      border-neutral-300/55 py-6 font-medium leading-5 last:pb-0 md:flex-nowrap md:py-4"
  >
    <span className="flex-shrink-0 rounded bg-neutral-50 px-4 py-1 text-neutral-500">
      {label}
    </span>
    {value.startsWith('https') ? (
      <div className="flex w-full items-center">
        <ConfigurationUrl href={value} />
      </div>
    ) : (
      <span className="text-neutral-950">{value}</span>
    )}
  </div>
)

export const AddChainManually = function ({ chain }: Props) {
  const t = useTranslations('get-started')
  return (
    <>
      <DataSection label={t('rpc-url')} value={chain.rpcUrls.default.http[0]} />
      <DataSection label={t('chain-id')} value={chain.id.toString()} />
      <DataSection
        label={t('currency-symbol')}
        value={chain.nativeCurrency.symbol}
      />
      <DataSection
        label={t('block-explorer-url')}
        value={chain.blockExplorers.default.url}
      />
    </>
  )
}
