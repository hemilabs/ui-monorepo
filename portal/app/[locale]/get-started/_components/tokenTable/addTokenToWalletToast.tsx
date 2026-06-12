'use client'

import { Toast } from 'components/toast'
import { useTranslations } from 'next-intl'

type Props = {
  variant: 'error' | 'success'
}

export const AddTokenToWalletToast = function ({ variant }: Props) {
  const tCommon = useTranslations('common')
  const t = useTranslations('get-started')

  if (variant === 'error') {
    return (
      <Toast
        description={t('add-token-error-description')}
        title={t('add-token-error-title')}
        variant="error"
      />
    )
  }

  return (
    <Toast
      autoCloseMs={0}
      title={tCommon('add-token-to-wallet-success')}
      variant="success"
    />
  )
}
