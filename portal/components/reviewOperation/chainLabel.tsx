import { RemoteChain } from 'types/chain'

import { ChainIcon } from './chainIcon'

interface Props {
  active?: boolean
  chainId: RemoteChain['id']
  label: string
}

export const ChainLabel = ({ active = false, chainId, label }: Props) => (
  <div className="flex items-center gap-x-2">
    <div className="shrink-0">
      <ChainIcon chainId={chainId} />
    </div>
    <span
      className={`text-sm font-normal ${
        active ? 'text-orange-600' : 'text-neutral-500'
      }`}
    >
      {label}
    </span>
  </div>
)
