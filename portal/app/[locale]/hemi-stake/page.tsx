import { PageLayout } from 'components/pageLayout'
import { PageTitle } from 'components/pageTitle'
import { useTranslations } from 'use-intl'

export const HemiStakePage = function () {
  const t = useTranslations('hemi-stake')

  return (
    <PageLayout variant="wide">
      <PageTitle size="wide" subtitle={t('subheading')} title="hemi Stake" />
    </PageLayout>
  )
}
