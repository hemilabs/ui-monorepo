import { RemoteChain } from 'app/networks'
import { BtcTransaction } from 'btc-wallet/unisat'
import { ExternalLink } from 'components/externalLink'
import { useChain } from 'hooks/useChain'
import { type Hash } from 'viem'

type Props = {
  chainId: RemoteChain['id']
  txHash: BtcTransaction | Hash
}
export const TxLink = function ({ chainId, txHash }: Props) {
  const chain = useChain(chainId)
  const hash = `${txHash.slice(0, 6)}...${txHash.slice(-4)}`
  const href = `${chain.blockExplorers.default.url}/tx/${txHash}`
  return (
    <ExternalLink
      className="cursor-pointer text-sm font-normal underline"
      href={href}
    >
      {hash}
    </ExternalLink>
  )
}
