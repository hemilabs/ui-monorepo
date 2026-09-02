import { type Locale } from 'i18n/routing'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PropsWithChildren } from 'react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return {
    title: `${t('ecosystem.document-title')} | ${t('metadata.title')}`,
  }
}

export default function EcosystemLayout({ children }: PropsWithChildren) {
  return <>{children}</>
}
