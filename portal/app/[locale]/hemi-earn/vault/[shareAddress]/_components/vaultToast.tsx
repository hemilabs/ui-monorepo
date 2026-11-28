import { Toast } from 'components/toast'
import { useChain } from 'hooks/useChain'
import { formatEvmHash } from 'utils/format'
import { type Chain, type Hash } from 'viem'

type Props = {
  chainId: Chain['id']
  description?: string
  title: string
  transactionHash: Hash
}

export const VaultToast = function ({
  chainId,
  description,
  title,
  transactionHash,
}: Props) {
  const chain = useChain(chainId)
  return (
    <Toast
      description={description}
      title={title}
      tx={{
        href: `${chain?.blockExplorers?.default.url}/tx/${transactionHash}`,
        label: formatEvmHash(transactionHash),
      }}
    />
  )
}
