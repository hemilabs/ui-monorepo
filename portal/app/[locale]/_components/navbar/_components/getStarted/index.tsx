import { Chevron } from 'components/icons/chevron'
import { Link } from 'components/link'
import { useNetworkType } from 'hooks/useNetworkType'
import { useUmami } from 'hooks/useUmami'
import { usePathname } from 'i18n/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React from 'react'

import hemiLogo from './_images/hemiLogo.png'
import { Background } from './background'

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
        className={`shadow-soft font-inter-variable mx-4 mb-4 flex
        cursor-pointer items-center justify-center gap-x-1 rounded-lg border
        border-neutral-300/55 bg-white py-2 text-sm font-semibold text-neutral-950 md:hidden
        `}
        href={href}
        onClick={track ? onClick : undefined}
      >
        <span>{t('get-started')}</span>
        <Chevron.Right className="[&>path]:fill-neutral-500" />
      </Link>
      <Link
        className={`hidden ${
          active ? '' : 'cursor-pointer'
        } group/item md:block`}
        href={href}
        onClick={track ? onClick : undefined}
      >
        <div className="shadow-soft relative">
          <Background
            className={`rounded-lg border
            ${
              active
                ? 'border-orange-500 [&>g>rect]:fill-orange-50'
                : 'border-neutral-300/55'
            }
            group-hover/item:[&>g>rect]:fill-orange-50`}
          />
          <div className="absolute left-0 top-0 flex h-full w-full flex-col justify-between">
            <div className="m-auto mt-7">
              <Image alt={'hemi-logo'} className="size-13" src={hemiLogo} />
            </div>
            <div className="flex flex-col justify-center px-4 pb-4">
              <div className="flex items-center">
                <span className="text-base text-neutral-950">
                  {t('get-started')}
                </span>
                <Chevron.Right className="pl-1 [&>path]:fill-neutral-500" />
              </div>
              <span className="text-sm text-neutral-500">
                {t('learn-how-to-start')}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </>
  )
}
