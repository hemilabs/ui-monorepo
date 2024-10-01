import { BtcTransaction } from 'btc-wallet/unisat'
import { ExternalLink } from 'components/externalLink'
import { ArrowDownLeftIcon } from 'components/icons/arrowDownLeftIcon'
import { useChain } from 'hooks/useChain'
import { type RemoteChain } from 'types/chain'
import { type Hash } from 'viem'

type Props = {
  chainId: RemoteChain['id']
  txHash: BtcTransaction | Hash
}
export const TxLink = function ({ chainId, txHash }: Props) {
  const chain = useChain(chainId)
  const hash = `${txHash.slice(0, 6)}...${txHash.slice(-4)}`
  const href = `${chain?.blockExplorers?.default.url}/tx/${txHash}`
  return (
    <div className="group/txhash-link flex w-full items-center justify-between gap-x-2">
      <ExternalLink
        className="cursor-pointer text-neutral-600 hover:text-neutral-950"
        href={href}
        // needed as there's event delegation in the row
        onClick={e => e.stopPropagation()}
      >
        {hash}
      </ExternalLink>
      <ArrowDownLeftIcon className="invisible group-hover/txhash-link:visible [&>path]:fill-neutral-950" />
    </div>
  )
}
