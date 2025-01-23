import { Chevron } from 'components/icons/chevron'
import { Link } from 'components/link'
import { useNetworkType } from 'hooks/useNetworkType'
import { useUmami } from 'hooks/useUmami'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React from 'react'

import { GetStartedBackground } from './getStartedBackground'
import { HemiLogo } from './hemiLogo'

export const GetStarted = function () {
  const [networkType] = useNetworkType()
  const pathname = usePathname()
  const t = useTranslations('navbar')
  const { track } = useUmami()

  const href = '/get-started'
  const onClick = () => track?.('nav - get started', { chain: networkType })
  const active = pathname.endsWith('/get-started/')

  return (
    <>
      <Link
        className={`flex cursor-pointer items-center justify-center gap-x-1
        rounded-lg bg-orange-500 py-3 text-sm text-white md:hidden
        `}
        href={href}
        onClick={track ? onClick : undefined}
      >
        <span>{t('get-started')}</span>
        <Chevron.Right />
      </Link>
      <Link
        className={`hidden ${active ? '' : 'cursor-pointer'} md:block`}
        href={href}
        onClick={track ? onClick : undefined}
      >
        <div
          className={`shadow-soft h-13 relative flex w-full overflow-hidden
          rounded-xl border border-solid transition-colors duration-300
          ${
            active
              ? 'border-orange-300/55 bg-orange-100'
              : 'border-neutral-300/55 bg-orange-50 hover:bg-orange-100'
          }
          `}
        >
          <GetStartedBackground className="w-full" />
          <div className="absolute left-3 top-4 z-20 flex items-center gap-x-1 text-sm">
            <HemiLogo />
            <span className="text-orange-500">{t('get-started')}</span>
            <Chevron.Right className="[&>path]:fill-orange-500" />
          </div>
        </div>
      </Link>
    </>
  )
}
