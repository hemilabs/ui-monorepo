import { Banner } from 'components/banner'
import { ExternalLink } from 'components/externalLink'
import { type ReactNode } from 'react'
import { useTranslations } from 'use-intl'

import { vetroTermsUrl } from '../_constants/vetro'

const termsLink = (chunks: ReactNode) => (
  <ExternalLink
    className="hoverable-text font-medium underline"
    href={vetroTermsUrl}
  >
    {chunks}
  </ExternalLink>
)

export const OperatorBanner = function () {
  const t = useTranslations('hemi-earn.operator')
  return <Banner>{t.rich('banner', { link: termsLink })}</Banner>
}

export const OperatorNote = function () {
  const t = useTranslations('hemi-earn.operator')
  return <Banner>{t.rich('note', { link: termsLink })}</Banner>
}
