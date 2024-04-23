import { useChain } from 'hooks/useChain'
import { Chain, Hash } from 'viem'

type Props = {
  chainId: Chain['id']
  txHash: Hash
}
export const TxLink = function ({ chainId, txHash }: Props) {
  const chain = useChain(chainId)
  const hash = `${txHash.slice(0, 6)}...${txHash.slice(-4)}`
  const href = `${chain.blockExplorers.default.url}/tx/${txHash}`
  return (
    <a
      className="cursor-pointer text-sm font-normal underline"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {hash}
    </a>
  )
}
