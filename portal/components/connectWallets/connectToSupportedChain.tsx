'use client'

import { useTranslations } from 'next-intl'

export const ConnectToSupportedChain = function () {
  const t = useTranslations()
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm font-medium text-neutral-500">
        {t('connect-wallets.connect-to-see-balance')}
      </p>
    </div>
  )
}
