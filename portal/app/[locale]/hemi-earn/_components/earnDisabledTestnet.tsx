'use client'

import { ButtonLink } from 'components/button'
import { LiveIcon } from 'components/icons/liveIcon'
import { useNetworkType } from 'hooks/useNetworkType'
import { usePathname } from 'i18n/navigation'
import { useTranslations } from 'next-intl'
import { MouseEvent } from 'react'

export const EarnDisabledTestnet = function () {
  const [, setNetworkType] = useNetworkType()
  const pathname = usePathname()
  const t = useTranslations('hemi-earn')
  const tCommon = useTranslations('common')

  const onClick = function (e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    setNetworkType('mainnet')
  }

  return (
    <div className="mt-8 flex flex-col items-center justify-center gap-y-1 rounded-xl bg-white py-48 shadow-md">
      <LiveIcon />
      <h2>{tCommon('only-live-on-mainnet')}</h2>
      <p className="mb-3 max-w-44 text-center font-medium text-neutral-500 sm:max-w-64 md:max-w-72 lg:max-w-72 xl:max-w-full">
        {t('switch-to-start-earning')}
      </p>
      <ButtonLink
        href={{ pathname, query: { networkType: 'mainnet' } }}
        onClick={onClick}
      >
        {tCommon('switch-to-mainnet')}
      </ButtonLink>
    </div>
  )
}
