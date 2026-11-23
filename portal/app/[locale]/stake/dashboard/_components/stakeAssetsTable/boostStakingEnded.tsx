import { useTranslations } from 'use-intl'

import { StarIcon } from '../../../_components/icons/starIcon'

export function BoostStakingEnded() {
  const t = useTranslations('stake-page.ended')
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-8">
      <div className="flex size-8 items-center justify-center rounded-full border border-orange-100 bg-orange-50">
        <StarIcon />
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="text-lg font-semibold text-neutral-950">{t('title')}</h3>
        <p className="max-w-72 font-normal text-neutral-500">
          {t('description')}
        </p>
      </div>
    </div>
  )
}
