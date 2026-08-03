'use client'

import { ButtonLink } from 'components/button'
import { LiveIcon } from 'components/icons/liveIcon'
import { usePathname } from 'i18n/navigation'
import { useTranslations } from 'next-intl'

export const SwitchToMainnet = function () {
  const pathname = usePathname()
  const t = useTranslations('hemi-earn.transactions')
  const tCommon = useTranslations('common')

  return (
    <div className="flex size-full flex-col items-center justify-center gap-y-1">
      <LiveIcon />
      <h4>{tCommon('only-live-on-mainnet')}</h4>
      <p className="mb-3 max-w-44 text-center font-medium text-neutral-500 sm:max-w-64 md:max-w-72 lg:max-w-72 xl:max-w-full">
        {t('switch-to-view')}
      </p>
      <ButtonLink href={{ pathname, query: { networkType: 'mainnet' } }}>
        {tCommon('switch-to-mainnet')}
      </ButtonLink>
    </div>
  )
}
