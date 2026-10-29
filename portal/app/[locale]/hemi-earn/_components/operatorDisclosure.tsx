import { Banner } from 'components/banner'
import { ExternalLink } from 'components/externalLink'
import { type ReactNode } from 'react'
import { useLocale, useTranslations } from 'use-intl'

import { vetroTermsUrl } from '../_constants/vetro'
import { useCanDeposit } from '../_hooks/useCanDeposit'
import { getVetroSupportUrl } from '../_utils/vetroSupport'

const termsLink = (chunks: ReactNode) => (
  <ExternalLink
    className="hoverable-text font-medium underline"
    href={vetroTermsUrl}
  >
    {chunks}
  </ExternalLink>
)

export const OperatorBanner = function () {
  const locale = useLocale()
  const t = useTranslations('hemi-earn.operator')
  const { canDeposit } = useCanDeposit()

  const supportLink = (chunks: ReactNode) => (
    <ExternalLink
      className="hoverable-text font-medium underline"
      href={getVetroSupportUrl(locale)}
    >
      {chunks}
    </ExternalLink>
  )

  return (
    <Banner>
      {!canDeposit && (
        <p className="mb-3">
          {t.rich('deposits-paused-details', { link: supportLink })}
        </p>
      )}
      {t.rich('banner', { link: termsLink })}
    </Banner>
  )
}

export const OperatorNote = function () {
  const t = useTranslations('hemi-earn.operator')
  return <Banner>{t.rich('note', { link: termsLink })}</Banner>
}
