import { ExternalLink } from 'components/externalLink'
import { useTranslations } from 'use-intl'

import { vetroPrivacyPolicyUrl, vetroTermsUrl } from '../_constants/vetro'

export const EarnFooter = function () {
  const t = useTranslations('hemi-earn.footer')

  return (
    <footer className="-mx-4 mt-8 bg-white text-xs text-neutral-500 md:sticky md:-bottom-3 md:-mb-3 lg:-mx-12 lg:-mb-15">
      <div className="bg-neutral-50/55 px-4 py-4 lg:px-12">
        <p>{t('attribution')}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5">
          <ExternalLink
            className="hoverable-text underline"
            href={vetroTermsUrl}
          >
            {t('vetro-terms')}
          </ExternalLink>
          <span aria-hidden>·</span>
          <ExternalLink
            className="hoverable-text underline"
            href={vetroPrivacyPolicyUrl}
          >
            {t('vetro-privacy')}
          </ExternalLink>
        </div>
      </div>
    </footer>
  )
}
