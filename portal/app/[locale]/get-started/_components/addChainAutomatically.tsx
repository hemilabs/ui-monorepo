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

const AddChainButton = lazy(() =>
  import('./addChain/addChainButton').then(mod => ({
    default: mod.AddChainButton,
  })),
)

export const AddChainAutomatically = function ({ chain, layer }: Props) {
  const content = (
    <ChainIdentityRow
      chain={chain}
      layer={layer}
      trailing={
        <Suspense fallback={<span aria-hidden="true" className="block h-7" />}>
          <AddChainButton chain={chain} />
        </Suspense>
      }
    />
  )

  return (
    <Suspense fallback={<Container>{content}</Container>}>
      <AddChain chain={chain}>{content}</AddChain>
    </Suspense>
  )
}
