import { PageLayout } from 'components/pageLayout'
import { PageTitle } from 'components/pageTitle'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTranslations } from 'use-intl'

import { maxYears, minDays } from './_utils/lockDurations'

export const HemiStakePage = function () {
  const t = useTranslations('hemi-stake')
  const { symbol } = useHemiToken()

  return (
    <PageLayout variant="wide">
      <PageTitle
        size="wide"
        subtitle={t('subheading', { maxYears, minDays, symbol })}
        title="Hemi Stake"
      />
    </PageLayout>
  )
}
