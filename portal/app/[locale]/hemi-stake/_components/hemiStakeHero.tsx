import { Badge } from 'components/badge'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTranslations } from 'use-intl'

import { maxYears, minDays } from '../_utils/lockCreationTimes'

export const HemiStakeHero = function () {
  const { symbol } = useHemiToken()
  const t = useTranslations('hemi-stake')

  return (
    <div className="flex flex-col gap-y-1 sm:max-w-3xl md:self-start lg:self-auto">
      <div className="flex items-center gap-x-2">
        <h2>
          hemi<span className="text-orange-600">Stake</span>
        </h2>
        <Badge variant="secondary">veHEMI</Badge>
      </div>
      <p className="body-text-normal text-left text-neutral-500">
        {t('subheading', { maxYears, minDays, symbol })}
      </p>
    </div>
  )
}
