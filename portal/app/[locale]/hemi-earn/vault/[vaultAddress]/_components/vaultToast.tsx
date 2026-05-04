import { Toast } from 'components/toast'
import { useChain } from 'hooks/useChain'
import { useTranslations } from 'next-intl'
import { formatEvmHash } from 'utils/format'
import { type Chain, type Hash } from 'viem'

type Props = {
  chainId: Chain['id']
  title: string
  transactionHash: Hash
}

export const VaultToast = function ({
  chainId,
  title,
  transactionHash,
}: Props) {
  const chain = useChain(chainId)
  const t = useTranslations('hemi-earn.vault')
  return (
    <Toast
      description={t('here-is-your-tx')}
      title={title}
      tx={{
        href: `${chain?.blockExplorers?.default.url}/tx/${transactionHash}`,
        label: formatEvmHash(transactionHash),
      }}
    />
  )
}
