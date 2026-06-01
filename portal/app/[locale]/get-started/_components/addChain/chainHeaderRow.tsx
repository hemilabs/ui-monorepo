import { ChainLogo } from 'components/chainLogo'
import { useTranslations } from 'next-intl'
import { Chain } from 'viem'

type Props = {
  chain: Chain
  layer: number
}

export const ChainHeaderRow = function ({ chain, layer }: Props) {
  const t = useTranslations('get-started')

  return (
    <div className="flex items-center gap-2 border-b border-neutral-100 pb-4">
      <ChainLogo chainId={chain.id} />
      <span className="body-text-semibold text-neutral-950">{chain.name}</span>
      <span className="body-text-normal text-neutral-500">
        {t('layer', { layer })}
      </span>
    </div>
  )
}
