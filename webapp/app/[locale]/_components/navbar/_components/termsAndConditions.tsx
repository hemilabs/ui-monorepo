import { ExternalLink } from 'components/externalLink'
import { useTranslations } from 'next-intl'

const cssLink = 'text-orange-500'

export const TermsAndConditions = function () {
  const t = useTranslations('navbar')
  return (
    <p className="font-base mx-auto w-3/4 text-center text-xs text-neutral-400 md:w-full md:text-left">
      {t.rich('agree-to-terms-and-policy', {
        policy: (chunk: string) => (
          <ExternalLink
            className={cssLink}
            href="https://hemi.xyz/privacy-policy/"
          >
            {chunk}
          </ExternalLink>
        ),
        terms: (chunk: string) => (
          <ExternalLink
            className={cssLink}
            href="https://hemi.xyz/terms-of-service"
          >
            {chunk}
          </ExternalLink>
        ),
      })}
    </p>
  )
}
