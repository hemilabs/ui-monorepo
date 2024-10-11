import { ChainLogo } from 'components/chainLogo'
import { useTranslations } from 'next-intl'
import { Chain } from 'viem'

import { ConfigurationUrl } from './configurationUrl'

type Props = {
  chain: Chain
  layer: number
}

const DataSection = ({
  clickableLink,
  label,
  value,
}: {
  clickableLink?: boolean
  label: string
  value: string
}) => (
  <div
    className="text-ms flex flex-row flex-wrap items-center gap-x-2 gap-y-2 border-t border-solid
      border-neutral-300/55 py-6 font-medium leading-5 last:pb-0 md:flex-nowrap md:py-4"
  >
    <span className="flex-shrink-0 rounded bg-neutral-50 px-4 py-1 text-neutral-500">
      {label}
    </span>
    {value.startsWith('https') ? (
      <div className="flex w-full items-center">
        <ConfigurationUrl clickableLink={clickableLink} href={value} />
      </div>
    ) : (
      <span className="text-neutral-950">{value}</span>
    )}
  </div>
)

export const AddChainManually = function ({ chain, layer }: Props) {
  const t = useTranslations('get-started')
  return (
    <div className="border-neutral/55 text-ms flex flex-col rounded-xl border border-solid p-4 font-medium leading-5">
      <div className="flex flex-row gap-x-1">
        <ChainLogo chainId={chain.id} />
        <span className="ml-1 text-neutral-950">{chain.name}</span>
        <span className="text-neutral-500">{t('layer', { layer })}</span>
      </div>
      <div className="mt-6 md:mt-4">
        <DataSection
          clickableLink={false}
          label={t('rpc-url')}
          value={chain.rpcUrls.default.http[0]}
        />
        <DataSection label={t('chain-id')} value={chain.id.toString()} />
        <DataSection
          label={t('currency-symbol')}
          value={chain.nativeCurrency.symbol}
        />
        <DataSection
          label={t('block-explorer-url')}
          value={chain.blockExplorers.default.url}
        />
      </div>
    </div>
  )
}
