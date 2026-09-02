import { type Locale } from 'i18n/routing'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PropsWithChildren } from 'react'

import StakingDashboardLayoutClient from './_components/stakingDashboardLayoutClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return {
    title: `${t('staking-dashboard.document-title')} | ${t('metadata.title')}`,
  }
}

const StakingDashboardLayout = ({ children }: PropsWithChildren) => (
  <StakingDashboardLayoutClient>{children}</StakingDashboardLayoutClient>
)

export default StakingDashboardLayout
