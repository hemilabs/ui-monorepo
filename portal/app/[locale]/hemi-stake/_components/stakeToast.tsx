import { Toast } from 'components/toast'
import { useHemi } from 'hooks/useHemi'
import { type ComponentProps } from 'react'
import { useTranslations } from 'use-intl'
import { formatEvmHash } from 'utils/format'
import { Hash } from 'viem'

type Props = {
  goTo?: ComponentProps<typeof Toast>['goTo']
  title: string
  transactionHash: Hash
}

export const StakeToast = function ({ goTo, title, transactionHash }: Props) {
  const hemi = useHemi()
  const t = useTranslations('hemi-stake')
  return (
    <Toast
      description={t('here-is-your-tx')}
      goTo={goTo}
      title={title}
      tx={{
        href: `${hemi.blockExplorers?.default.url}/tx/${transactionHash}`,
        label: formatEvmHash(transactionHash),
      }}
    />
  )
}
