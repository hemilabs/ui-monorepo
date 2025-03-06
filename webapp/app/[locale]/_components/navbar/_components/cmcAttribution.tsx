import { ExternalLink } from 'components/externalLink'
import { useTranslations } from 'next-intl'

const cssLink = 'text-orange-500 hover:text-orange-700'

export const CmcAttribution = function () {
  const t = useTranslations('navbar')
  return (
    <p
      className="font-base mx-auto items-center pt-4 text-center text-xs text-neutral-400
      md:w-full md:text-left lg:flex lg:items-center lg:justify-between"
    >
      {t.rich('data-attribution', {
        link: (chunk: string) => (
          <ExternalLink className={cssLink} href="https://coinmarketcap.com/">
            {chunk}
          </ExternalLink>
        ),
      })}
    </p>
  )
}
