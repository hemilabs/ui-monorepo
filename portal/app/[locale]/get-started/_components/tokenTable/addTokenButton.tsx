'use client'

import { AddTokenToWallet } from 'components/addTokenToWallet'
import { useTranslations } from 'next-intl'
import { EvmToken } from 'types/token'

type Props = {
  token: EvmToken
}

export const AddTokenTableButton = function ({ token }: Props) {
  const t = useTranslations('get-started')
  const tCommon = useTranslations('common')

  return (
    <AddTokenToWallet
      labels={{
        error: tCommon('add-token-to-wallet-error'),
        idle: t('add-token'),
        pending: tCommon('add-token-to-wallet-pending'),
        success: tCommon('add-token-to-wallet-success'),
      }}
      token={token}
      variant="button"
    />
  )
}
