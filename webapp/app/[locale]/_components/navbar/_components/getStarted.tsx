import { Chevron } from 'components/icons/chevron'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Link from 'next-intl/link'
import React from 'react'

import backgroundImg from './nav-get-started-background.png'

export const GetStarted = function () {
  const t = useTranslations('navbar')
  const href = '/get-started'

  return (
    <>
      <Link
        className={`flex cursor-pointer items-center justify-center gap-x-1
        rounded-lg bg-orange-500 py-3 text-sm text-white md:hidden
        `}
        href={href}
      >
        <span>{t('get-started')}</span>
        <Chevron.Right />
      </Link>
      <Link className="hidden cursor-pointer md:block" href={href}>
        <div
          className="relative flex h-20 w-full overflow-hidden 
          rounded-xl border border-neutral-300
          border-opacity-50 transition-colors duration-300"
        >
          <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_right,transparent,#FFF6ED_48%)] hover:bg-slate-500 hover:bg-opacity-5"></div>
          <div className="relative ml-auto h-full w-7/12">
            <Image
              alt="Get started background image"
              fill
              src={backgroundImg}
              style={{ objectFit: 'fill' }}
            />
          </div>
          <div className="absolute top-1/4 z-20 flex items-center gap-x-1 text-sm">
            <span className="ml-3 text-orange-500">{t('get-started')}</span>
            <Chevron.Right className="[&>path]:fill-orange-500" />
          </div>
        </div>
      </Link>
    </>
  )
}
