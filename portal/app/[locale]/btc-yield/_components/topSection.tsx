'use client'

import { ButtonLink } from 'components/button'
import { Chevron } from 'components/icons/chevron'
import hemiSocials from 'hemi-socials'
import { useHemiBtcToken } from 'hooks/useHemiBtcToken'
import { useTranslations } from 'next-intl'

const { website } = hemiSocials

export const TopSection = function () {
  const { symbol } = useHemiBtcToken()
  const t = useTranslations('bitcoin-yield')

  return (
    <div className="mb-8 flex flex-col items-center justify-between gap-y-6 sm:mb-10 sm:w-2/3 sm:items-start lg:mb-12 lg:w-full xl:flex-row xl:items-center">
      <div className="flex flex-col gap-y-1 sm:max-w-96 md:self-start lg:self-auto">
        <h2>{t('heading')}</h2>
        <p className="body-text-normal text-left text-neutral-600">
          {t('subheading')}
        </p>
      </div>
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
