'use client'

import { useTranslations } from 'next-intl'

export const QuickStart = function () {
  const t = useTranslations()
  return (
    <section>
      <h3>{t('network.your-quick-starter')}</h3>
      <span>TBD quick start</span>
    </section>
  )
}
