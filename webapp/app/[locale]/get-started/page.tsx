'use client'

import { useTranslations } from 'next-intl'

const GetStarted = function () {
  const t = useTranslations('get-started')

  return (
    <>
      <h1 className="text-2xl font-medium leading-8 text-neutral-950">
        {t('heading')}
      </h1>
      <p className="text-ms font-medium leading-5 text-neutral-600">
        {t('subheading')}
      </p>
    </>
  )
}

export default GetStarted
