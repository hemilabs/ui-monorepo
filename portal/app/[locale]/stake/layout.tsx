import { type Locale } from 'i18n/routing'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import StakeLayoutClient from './_components/stakeLayoutClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return {
    title: `${t('stake-page.document-title')} | ${t('metadata.title')}`,
  }
}

export default function StakeLayout(props: { children: React.ReactNode }) {
  return <StakeLayoutClient {...props} />
}
