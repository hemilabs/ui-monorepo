import { ChainLogo } from 'components/chainLogo'
import { useChain } from 'hooks/useChain'
import { type RemoteChain } from 'types/chain'

type Props = {
  chainId: RemoteChain['id']
}
export const Chain = function ({ chainId }: Props) {
  const chain = useChain(chainId)
  return (
    <div className="flex items-center gap-x-1.5">
      <ChainLogo chainId={chainId} />
      <span className="capitalize text-neutral-950">{chain?.name ?? '-'}</span>
    </div>
  )
}
