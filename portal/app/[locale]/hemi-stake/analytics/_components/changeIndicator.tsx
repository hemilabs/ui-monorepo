import { Arrow } from 'components/icons/arrow'
import { useTranslations } from 'use-intl'

type Props = {
  children: string
  isUp: boolean
}

export const ChangeIndicator = function ({ children, isUp }: Props) {
  const t = useTranslations('hemi-stake.analytics')

  const color = isUp ? 'text-emerald-600' : 'text-rose-600'

  return (
    <span className={`flex items-center gap-x-0.5 ${color}`}>
      <Arrow
        aria-hidden
        className={`h-2.5 w-2 [&>path]:fill-current ${isUp ? '' : 'rotate-180'}`}
      />
      <span className="sr-only">
        {isUp ? t('increased-by') : t('decreased-by')}
      </span>
      {children}
    </span>
  )
}
