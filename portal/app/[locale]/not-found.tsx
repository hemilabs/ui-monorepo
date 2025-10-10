'use client'

import 'styles/globals.css'
import { ExclamationMark } from 'components/icons/exclamationMark'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import Error404 from '../_images/404.svg'

export default function NotFound() {
  const t = useTranslations('error-pages')

  return (
    <div className="flex h-screen">
      <Image
        alt="404"
        className="absolute inset-0 -top-64 m-auto w-72 md:w-fit"
        src={Error404}
      />
      <div className="z-10 m-auto flex flex-col items-center gap-4">
        <ExclamationMark />
        <div className="text-center">
          <h1 className="text-lg font-medium text-neutral-950">
            {t('not-found.title')}
          </h1>
          <h3 className="mt-1 text-base font-medium text-neutral-500">
            {t('not-found.description')}
          </h3>
        </div>
        <a
          className="button--base button-primary button-small button-regular"
          href="/"
        >
          {t('not-found.action')}
        </a>
      </div>
    </div>
  )
}
