'use client'

import { ButtonLink } from 'components/button'
import { Chevron } from 'components/icons/chevron'
import { PageTitle } from 'components/pageTitle'
import hemiSocials from 'hemi-socials'
import { useHemiBtcToken } from 'hooks/useHemiBtcToken'
import { useTranslations } from 'next-intl'

const { website } = hemiSocials

export const TopSection = function () {
  const { symbol } = useHemiBtcToken()
  const t = useTranslations('bitcoin-yield')

  return (
    <div className="mb-8 flex flex-col items-center justify-between gap-y-6 sm:mb-10 sm:w-2/3 sm:items-start lg:mb-12 lg:w-full xl:flex-row xl:items-center">
      <PageTitle subtitle={t('subheading')} title={t('heading')} />
      <div className="flex flex-col items-center gap-3 max-lg:w-full sm:flex-row [&>a]:max-sm:w-full">
        <ButtonLink href={`${website}/btc-yield`} variant="secondary">
          {t('learn-more-about-hemibtc', { symbol })}
        </ButtonLink>
        <ButtonLink href="/tunnel">
          <span>{t('tunnel-to-hemi')}</span>
          <span className="[&_path]:fill-white">
            <Chevron.Right />
          </span>
        </ButtonLink>
      </div>
    </div>
  )
}
