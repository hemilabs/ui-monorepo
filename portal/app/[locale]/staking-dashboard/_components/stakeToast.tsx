import { Toast } from 'components/toast'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import { formatEvmHash } from 'utils/format'
import { Hash } from 'viem'

type Props = {
  transactionHash: Hash
}

export const StakeToast = function ({ transactionHash }: Props) {
  const hemi = useHemi()
  const t = useTranslations('staking-dashboard')
  return (
    <Toast
      description={t('here-is-your-stake-tx')}
      title={t('stake-successful')}
      tx={{
        href: `${hemi.blockExplorers.default.url}/tx/${transactionHash}`,
        label: formatEvmHash(transactionHash),
      }}
    />
  )
}
