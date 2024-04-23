import { ChainLogo } from 'components/chainLogo'
import { useChain } from 'hooks/useChain'
import { type Chain as ChainType } from 'viem'

type Props = {
  chainId: ChainType['id']
}
export const Chain = function ({ chainId }: Props) {
  const chain = useChain(chainId)
  return (
    <div className="flex items-center gap-x-2">
      <ChainLogo chainId={chainId} />
      <span className="text-sm font-normal capitalize">{chain.name}</span>
    </div>
  )
}
