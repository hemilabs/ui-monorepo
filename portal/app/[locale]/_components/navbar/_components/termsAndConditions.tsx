import { ExternalLink } from 'components/externalLink'
import hemiSocials from 'hemi-socials'
import { useTranslations } from 'next-intl'

const cssLink = 'text-orange-500 hover:text-orange-700'

const { website } = hemiSocials

export const TermsAndConditions = function () {
  const t = useTranslations('navbar')
  return (
    <p className="font-base mx-auto w-full pb-2 text-left text-xs text-neutral-400">
      {t.rich('agree-to-terms-and-policy', {
        policy: chunk => (
          <ExternalLink className={cssLink} href={`${website}/privacy-policy/`}>
            {chunk}
          </ExternalLink>
        ),
        terms: chunk => (
          <ExternalLink className={cssLink} href={`${website}/terms`}>
            {chunk}
          </ExternalLink>
        ),
      })}
    </p>
  )
}
