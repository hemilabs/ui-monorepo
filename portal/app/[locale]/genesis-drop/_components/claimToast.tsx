import { Toast } from 'components/toast'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import { formatEvmHash } from 'utils/format'
import { Hash } from 'viem'

type Props = {
  transactionHash: Hash
}

export const ClaimToast = function ({ transactionHash }: Props) {
  const hemi = useHemi()
  const t = useTranslations('genesis-drop')
  return (
    <Toast
      description={t('here-is-your-claim-tx')}
      goTo={{
        href: '/staking-dashboard',
        label: t('go-to-staking-dashboard'),
      }}
      title={t('claim-and-stake-successful')}
      tx={{
        href: `${hemi.blockExplorers.default.url}/tx/${transactionHash}`,
        label: formatEvmHash(transactionHash),
      }}
    />
  )
}
