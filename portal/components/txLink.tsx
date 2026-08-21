import { BtcTransaction } from 'btc-wallet/unisat'
import { ExternalLink } from 'components/externalLink'
import { useChain } from 'hooks/useChain'
import { type RemoteChain } from 'types/chain'
import { isEvmNetworkId } from 'utils/chain'
import { formatBtcHash, formatEvmHash } from 'utils/format'
import { type Hash } from 'viem'

const textColors = {
  'neutral-500': 'text-neutral-500',
  'neutral-600': 'text-neutral-600',
} as const

type Props = {
  chainId: RemoteChain['id']
  textColor?: keyof typeof textColors
  txHash: BtcTransaction | Hash | undefined
}
export const TxLink = function ({
  chainId,
  textColor = 'neutral-600',
  txHash,
}: Props) {
  const chain = useChain(chainId)

  if (typeof txHash !== 'string' || !txHash) {
    return null
  }

  const hash = isEvmNetworkId(chainId)
    ? formatEvmHash(txHash as Hash)
    : formatBtcHash(txHash)

  const href = `${chain?.blockExplorers?.default.url}/tx/${txHash}`
  return (
    <div className="flex w-full items-center">
      <ExternalLink
        className={`cursor-pointer hover:text-neutral-950 ${textColors[textColor]}`}
        href={href}
        // needed as there's event delegation in the row
        onClick={e => e.stopPropagation()}
      >
        {hash}
      </ExternalLink>
    </div>
  )
}
