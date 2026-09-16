import { Arrow } from 'components/icons/arrow'
import { useTranslations } from 'use-intl'

type Props = {
  children: string
  isUp: boolean
}

export const ChangeIndicator = function ({ children, isUp }: Props) {
  const t = useTranslations('hemi-stake.analytics')

  return (
    <span className="flex items-center gap-x-0.5">
      <Arrow
        aria-hidden
        className={`h-2.5 w-2 [&>path]:fill-neutral-600 ${isUp ? '' : 'rotate-180'}`}
      />
      <span className="sr-only">
        {isUp ? t('increased-by') : t('decreased-by')}
      </span>
      {children}
    </span>
  )
}
