import { ChainLogo } from 'components/chainLogo'
import { useTranslations } from 'next-intl'
import { type ReactNode } from 'react'
import { type Chain } from 'viem'

type Props = {
  chain: Chain
  layer: number
  trailing?: ReactNode
}

export const ChainIdentityRow = function ({ chain, layer, trailing }: Props) {
  const t = useTranslations('get-started')

  return (
    <div className="flex min-h-7 w-full items-center justify-between gap-4">
      <div className="flex min-h-7 items-center gap-2">
        <ChainLogo chainId={chain.id} />
        <span className="body-text-semibold text-neutral-950">
          {chain.name}
        </span>
        <span className="body-text-normal text-neutral-500">
          {t('layer', { layer })}
        </span>
      </div>
      {trailing ? (
        <div className="flex h-7 shrink-0 items-center justify-end">
          {trailing}
        </div>
      ) : null}
    </div>
  )
}
