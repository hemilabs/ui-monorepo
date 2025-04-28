import { ChainLogo } from 'components/chainLogo'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { lazy, Suspense } from 'react'
import { type Chain } from 'viem'

import { Container } from './addChain/container'

type Props = {
  chain: Chain
  layer: number
}

const AddChain = lazy(() =>
  import('./addChain').then(mod => ({ default: mod.AddChain })),
)

const AddChainButton = dynamic(
  () => import('./addChain/addChainButton').then(mod => mod.AddChainButton),
  {
    loading: () => (
      <span className="text-sm font-medium text-neutral-950">...</span>
    ),
    ssr: false,
  },
)

export const AddChainAutomatically = function ({ chain, layer }: Props) {
  const t = useTranslations('get-started')

  const content = (
    <div className="flex flex-row gap-x-1">
      <div className="w-5">
        <ChainLogo chainId={chain.id} />
      </div>
      <span className="ml-1 text-neutral-950">{chain.name}</span>
      <span className="text-neutral-500">{t('layer', { layer })}</span>
      <div className="ml-auto">{<AddChainButton chain={chain} />}</div>
    </div>
  )

  return (
    <Suspense fallback={<Container>{content}</Container>}>
      <AddChain chain={chain}>{content}</AddChain>
    </Suspense>
  )
}
