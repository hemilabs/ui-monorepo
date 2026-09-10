import { ExclamationMark } from 'components/icons/exclamationMark'
import { Image } from 'components/image'
import { Link } from 'components/link'
import { useTranslations } from 'use-intl'

import { error404 } from '../_images/error404'

export const NotFound = function () {
  const t = useTranslations('error-pages')

  return (
    <div className="flex h-full">
      <Image
        alt="404"
        className="absolute inset-0 -top-64 m-auto w-72 md:w-fit"
        {...error404}
      />
      <div className="z-10 m-auto flex flex-col items-center gap-4">
        <ExclamationMark />
        <div className="text-center">
          <h1 className="text-4xl font-medium text-neutral-950">
            {t('not-found.title')}
          </h1>
          <h3 className="mt-1 text-sm font-medium text-neutral-500">
            {t('not-found.description')}
          </h3>
        </div>
        <Link
          className="button--base button-primary button-small button-regular"
          href="/"
        >
          {t('not-found.action')}
        </Link>
      </div>
    </div>
  )
}
