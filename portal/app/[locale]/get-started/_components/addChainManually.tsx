import { useTranslations } from 'next-intl'
import { Chain } from 'viem'

import { ChainHeaderRow } from './addChain/chainHeaderRow'
import { NetworkConfigCard } from './addChain/networkConfigCard'
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
  <div className="flex items-center justify-between gap-4 border-b border-neutral-100 py-4 last:border-b-0">
    <span className="body-text-semibold shrink-0 text-neutral-950">
      {label}
    </span>
    {value.startsWith('https') ? (
      <div className="flex min-w-0 items-center justify-end gap-1">
        <ConfigurationUrl clickableLink={clickableLink} href={value} />
      </div>
    ) : (
      <span className="body-text-normal text-neutral-500">{value}</span>
    )}
  </div>
)

export const AddChainManually = function ({ chain, layer }: Props) {
  const t = useTranslations('get-started')

  return (
    <NetworkConfigCard>
      <ChainHeaderRow chain={chain} layer={layer} />
      <DataSection
        clickableLink={false}
        label={`${t('rpc-url')}:`}
        value={chain.rpcUrls.default.http[0]}
      />
      <DataSection label={`${t('chain-id')}:`} value={chain.id.toString()} />
      <DataSection
        label={`${t('currency-symbol')}:`}
        value={chain.nativeCurrency.symbol}
      />
      <DataSection
        clickableLink={false}
        label={`${t('block-explorer-url')}:`}
        value={chain.blockExplorers!.default.url}
      />
    </NetworkConfigCard>
  )
}
