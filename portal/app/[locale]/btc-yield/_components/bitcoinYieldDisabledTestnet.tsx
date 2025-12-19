'use client'

import { ButtonLink } from 'components/button'
import { LiveIcon } from 'components/icons/liveIcon'
import { usePathname } from 'i18n/navigation'
import { useTranslations } from 'next-intl'

export const BitcoinYieldDisabledTestnet = function () {
  const pathname = usePathname()
  const t = useTranslations('bitcoin-yield')
  const tCommon = useTranslations('common')

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-1">
      <LiveIcon />
      <h2>{tCommon('only-live-on-mainnet')}</h2>
      <p className="mb-3 max-w-44 text-center font-medium text-neutral-500 sm:max-w-64 md:max-w-72 lg:max-w-72 xl:max-w-full">
        {t('switch-to-start-staking')}
      </p>
      <ButtonLink href={{ pathname, query: { networkType: 'mainnet' } }}>
        {tCommon('switch-to-mainnet')}
      </ButtonLink>
    </div>
  )
}
