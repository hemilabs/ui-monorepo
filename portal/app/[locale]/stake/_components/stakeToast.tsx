import { Toast } from 'components/toast'
import { useChain } from 'hooks/useChain'
import { useTranslations } from 'next-intl'
import { RemoteChain } from 'types/chain'
import { formatEvmHash } from 'utils/format'
import { type Hash } from 'viem'

type ToastType = 'stake' | 'unstake'

type Props = {
  chainId: RemoteChain['id']
  txHash: Hash
  type: ToastType
}

export const StakeToast = function ({ chainId, txHash, type }: Props) {
  const blockExplorer = useChain(chainId)?.blockExplorers?.default

  const t = useTranslations('stake-page.toast')

  const tx = {
    href: `${blockExplorer?.url}/tx/${txHash}`,
    label: formatEvmHash(txHash),
  }

  if (type === 'stake') {
    return (
      <Toast
        description={t('here-your-stake-tx', {
          type: t('staking'),
        })}
        goTo={{
          href: '/stake/dashboard',
          label: t('go-staking-dashboard'),
        }}
        title={t('staking-successful')}
        tx={tx}
      />
    )
  }
  return (
    <Toast
      description={t('here-your-stake-tx', {
        type: t('unstaking'),
      })}
      title={t('unstaking-successful')}
      tx={tx}
    />
  )
}
