import { Badge } from 'components/badge'
import { Card } from 'components/card'
import { ArrowDownOnSquareIcon } from 'components/icons/arrowDownOnSquareIcon'
import { type ComponentProps } from 'react'
import { useTranslations } from 'use-intl'

type PerkCardProps = {
  badge: string
  description: string
  title: string
  variant: ComponentProps<typeof Badge>['variant']
}

const PerkCard = ({ badge, description, title, variant }: PerkCardProps) => (
  <Card shadow="sm">
    <div className="flex h-full flex-col justify-between gap-y-3 p-4 md:min-h-56">
      <div className="flex items-start justify-between gap-x-2">
        <div className="shrink-0">
          <Badge variant={variant}>{badge}</Badge>
        </div>
        <ArrowDownOnSquareIcon
          aria-hidden
          className="shrink-0 text-orange-500"
        />
      </div>
      <div className="flex min-w-0 flex-col gap-y-2">
        <h4>{title}</h4>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
    </div>
  </Card>
)

export const PerksSection = function () {
  const t = useTranslations('hemi-stake.perks')

  return (
    <section className="mt-8">
      <h3>{t('heading')}</h3>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <PerkCard
          badge={t('protocol-fees.badge')}
          description={t('protocol-fees.description')}
          title={t('protocol-fees.title')}
          variant="positive"
        />
        <PerkCard
          badge={t('governance.badge')}
          description={t('governance.description')}
          title={t('governance.title')}
          variant="secondary"
        />
        <PerkCard
          badge={t('ecosystem-launches.badge')}
          description={t('ecosystem-launches.description')}
          title={t('ecosystem-launches.title')}
          variant="primary"
        />
      </div>
    </section>
  )
}
