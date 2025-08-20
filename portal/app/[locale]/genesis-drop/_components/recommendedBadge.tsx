import { useTranslations } from 'next-intl'

export const RecommendedBadge = function () {
  const t = useTranslations('genesis-drop.claim-options')

  return (
    <div className="bg-sky-550/5 border-sky-550/15 flex h-6 items-center justify-center rounded-xl border border-solid px-2">
      <span className="text-xs font-medium text-sky-500">
        {t('recommended')}
      </span>
    </div>
  )
}
