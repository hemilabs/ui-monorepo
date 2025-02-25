import { ExternalLink } from 'components/externalLink'
import { useTranslations } from 'next-intl'

export const CmcAttribution = function () {
  const t = useTranslations('common')

  return (
    <div className="flex flex-col justify-end">
      <p className="flex text-sm font-normal text-neutral-600">
        {t('data-attribution')}
        <ExternalLink href="https://coinmarketcap.com/">
          <span className="ml-1 text-orange-500 hover:text-orange-700">
            CoinMarketCap.com
          </span>
        </ExternalLink>
      </p>
    </div>
  )
}
