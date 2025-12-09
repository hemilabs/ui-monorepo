import { ExternalLink } from 'components/externalLink'
import { useTranslations } from 'next-intl'

export const CmcAttribution = function () {
  const t = useTranslations('navbar')
  return (
    <p className="font-base mx-auto w-full pt-2 text-left text-xs text-neutral-400 md:pb-0">
      {t.rich('data-attribution', {
        link: chunk => (
          <ExternalLink
            className="hoverable-text"
            href="https://coinmarketcap.com/"
          >
            {chunk}
          </ExternalLink>
        ),
      })}
    </p>
  )
}
