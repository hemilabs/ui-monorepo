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
  const blockExplorer = useChain(chainId).blockExplorers.default

  const t = useTranslations('stake-page.toast')

  return (
    <Toast
      description={t('here-your-stake-tx', {
        type: t(type === 'stake' ? 'staking' : 'unstaking'),
      })}
      goTo={
        type === 'stake'
          ? {
              href: '/stake/dashboard',
              label: t('go-staking-dashboard'),
            }
          : undefined
      }
      title={
        type === 'stake' ? t('staking-successful') : t('unstaking-successful')
      }
      tx={{
        href: `${blockExplorer.url}/tx/${txHash}`,
        label: formatEvmHash(txHash),
      }}
    />
  )
}
