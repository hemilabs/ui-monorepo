import { lazy, type ReactNode, Suspense } from 'react'
import { type Chain } from 'viem'

import { AddChainButton } from './addChain/addChainButton'
import { ChainIdentityRow } from './addChain/chainIdentityRow'
import { Container } from './addChain/container'

type Props = {
  chain: Chain
  layer: number
}

const AddChain = lazy(() =>
  import('./addChain').then(mod => ({ default: mod.AddChain })),
)

export const AddChainAutomatically = function ({ chain, layer }: Props) {
  const row = (trailing: ReactNode) => (
    <ChainIdentityRow chain={chain} layer={layer} trailing={trailing} />
  )

  return (
    <Suspense
      fallback={
        <Container>
          {row(<span aria-hidden="true" className="block h-7" />)}
        </Container>
      }
    >
      <AddChain chain={chain}>{row(<AddChainButton chain={chain} />)}</AddChain>
    </Suspense>
  )
}
