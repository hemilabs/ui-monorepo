import { ExternalLink } from 'components/externalLink'
import { useTranslations } from 'next-intl'

const cssLink = 'text-orange-500 hover:text-orange-700'

export const TermsAndConditions = function () {
  const t = useTranslations('navbar')
  return (
    <p className="font-base mx-auto w-full pb-2 text-left text-xs text-neutral-400">
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
