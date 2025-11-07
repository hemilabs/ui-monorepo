'use client'

import { ButtonLink } from 'components/button'
import { Chevron } from 'components/icons/chevron'
import { P } from 'components/paragraph'
import { useHemiBtcToken } from 'hooks/useHemiBtcToken'
import { useTranslations } from 'next-intl'

export const TopSection = function () {
  const { symbol } = useHemiBtcToken()
  const t = useTranslations('bitcoin-yield')

  return (
    <section>
      <div className="mb-12 flex items-center justify-between">
        <div className="max-w-120 flex flex-col gap-y-1">
          <h2>{t('heading')}</h2>
          <P className="text-neutral-600">{t('subheading')}</P>
        </div>
        <div className="flex items-center gap-x-3">
          {/* TODO define external link - using docs as placeholder */}
          <ButtonLink href="https://docs.hemi.xyz/" variant="secondary">
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
    </section>
  )
}
