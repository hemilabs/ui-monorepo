import { useTranslations } from 'next-intl'

export const RecommendedBadge = function () {
  const t = useTranslations('genesis-drop.claim-options')

  return (
    <div className="flex h-6 items-center justify-center rounded-xl border border-solid border-sky-550/15 bg-sky-550/5 px-2">
      <span className="text-xs font-medium text-sky-500">
        {t('recommended')}
      </span>
    </div>
  )
}
