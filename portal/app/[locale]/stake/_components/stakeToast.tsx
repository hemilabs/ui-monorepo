import { Toast } from 'components/toast'
import { useChain } from 'hooks/useChain'
import { RemoteChain } from 'types/chain'
import { useTranslations } from 'use-intl'
import { formatEvmHash } from 'utils/format'
import { type Hash } from 'viem'

type Props = {
  chainId: RemoteChain['id']
  txHash: Hash
}

export const StakeToast = function ({ chainId, txHash }: Props) {
  const blockExplorer = useChain(chainId)?.blockExplorers?.default

  const t = useTranslations('stake-page.toast')

  const tx = {
    href: `${blockExplorer?.url}/tx/${txHash}`,
    label: formatEvmHash(txHash),
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
