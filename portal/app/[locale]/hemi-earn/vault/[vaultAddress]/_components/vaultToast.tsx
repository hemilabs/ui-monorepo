import { Toast } from 'components/toast'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import { formatEvmHash } from 'utils/format'
import { type Hash } from 'viem'

type Props = {
  title: string
  transactionHash: Hash
}

export const VaultToast = function ({ title, transactionHash }: Props) {
  const hemi = useHemi()
  const t = useTranslations('hemi-earn.vault')
  return (
    <Toast
      description={t('here-is-your-tx')}
      title={title}
      tx={{
        href: `${hemi.blockExplorers?.default.url}/tx/${transactionHash}`,
        label: formatEvmHash(transactionHash),
      }}
    />
  )
}
