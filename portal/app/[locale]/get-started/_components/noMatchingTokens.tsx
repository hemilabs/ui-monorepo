'use client'

import { MagnifyingGlassIcon } from 'components/icons/magnifyingGlassIcon'
import { useTranslations } from 'next-intl'

export const NoMatchingTokens = function () {
  const t = useTranslations('get-started')

  return (
    <div className="flex min-h-72 w-full flex-col items-center justify-center gap-y-2 px-4">
      <div className="flex size-8 items-center justify-center rounded-full bg-orange-50 [&_path]:fill-orange-600">
        <MagnifyingGlassIcon size="s" />
      </div>
      <h4 className="text-mid-md font-semibold text-neutral-950">
        {t('no-matching-tokens')}
      </h4>
      <p className="max-w-[330px] text-center text-sm text-neutral-500">
        {t('no-matching-tokens-hint')}
      </p>
    </div>
  )
}
