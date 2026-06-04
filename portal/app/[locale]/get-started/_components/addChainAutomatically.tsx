import dynamic from 'next/dynamic'
import { lazy, Suspense } from 'react'
import { type Chain } from 'viem'

import { ChainIdentityRow } from './addChain/chainIdentityRow'
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
    loading: () => <span aria-hidden="true" className="block h-7" />,
    ssr: false,
  },
)

export const AddChainAutomatically = function ({ chain, layer }: Props) {
  const content = (
    <ChainIdentityRow
      chain={chain}
      layer={layer}
      trailing={<AddChainButton chain={chain} />}
    />
  )

  return (
    <Suspense fallback={<Container>{content}</Container>}>
      <AddChain chain={chain}>{content}</AddChain>
    </Suspense>
  )
}
