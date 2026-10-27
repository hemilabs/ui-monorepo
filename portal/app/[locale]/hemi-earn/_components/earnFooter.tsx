import { ExternalLink } from 'components/externalLink'
import { useTranslations } from 'use-intl'

import { vetroPrivacyPolicyUrl, vetroTermsUrl } from '../_constants/vetro'

export const EarnFooter = function () {
  const t = useTranslations('hemi-earn.footer')

  const links = [
    { href: vetroTermsUrl, label: t('vetro-terms') },
    { href: vetroPrivacyPolicyUrl, label: t('vetro-privacy') },
  ]

  return (
    <footer className="mt-8 bg-white text-xs text-neutral-500 md:sticky md:-bottom-3 md:-mb-3 lg:-mb-15">
      <div className="bg-neutral-50/55 py-4">
        <p>{t('attribution')}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5">
          {links.map((link, index) => (
            <span className="flex items-center gap-x-1.5" key={link.href}>
              <ExternalLink
                className="text-orange-500 underline hover:text-orange-600"
                href={link.href}
              >
                {link.label}
              </ExternalLink>
              {index < links.length - 1 && <span aria-hidden>·</span>}
            </span>
          ))}
        </div>
      </div>
    </footer>
  )
}
