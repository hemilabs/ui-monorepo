import { Badge } from 'components/badge'
import { useTranslations } from 'use-intl'

type Props = {
  enabled: boolean
}

export const AutoRelockBadge = function ({ enabled }: Props) {
  const t = useTranslations('hemi-stake.table')
  return (
    <Badge size="small" variant={enabled ? 'primary' : 'secondary'}>
      {t(enabled ? 'auto-relock-on' : 'auto-relock-off')}
    </Badge>
  )
}
