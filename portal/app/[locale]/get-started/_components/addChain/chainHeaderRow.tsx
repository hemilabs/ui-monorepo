import { type Chain } from 'viem'

import { ChainIdentityRow } from './chainIdentityRow'

type Props = {
  chain: Chain
  layer: number
}

export const ChainHeaderRow = ({ chain, layer }: Props) => (
  <div className="border-b border-neutral-100 pb-4">
    <ChainIdentityRow chain={chain} layer={layer} />
  </div>
)
