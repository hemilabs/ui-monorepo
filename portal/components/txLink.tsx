import { BtcTransaction } from 'btc-wallet/unisat'
import { ExternalLink } from 'components/externalLink'
import { useChain } from 'hooks/useChain'
import { type RemoteChain } from 'types/chain'
import { formatEvmHash } from 'utils/format'
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

  if (!txHash) {
    return null
  }

  const href = `${chain?.blockExplorers?.default.url}/tx/${txHash}`
  return (
    <div className="flex w-full items-center">
      <ExternalLink
        className={`cursor-pointer hover:text-neutral-950 ${textColors[textColor]}`}
        href={href}
        // needed as there's event delegation in the row
        onClick={e => e.stopPropagation()}
      >
        {formatEvmHash(txHash)}
      </ExternalLink>
    </div>
  )
}
