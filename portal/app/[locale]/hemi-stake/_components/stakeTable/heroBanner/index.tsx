import { Image } from 'components/image'
import { PixelPool } from 'components/pixelPool'
import { useTranslations } from 'use-intl'

import pixelBanner from './pixelBanner.svg'
import pixelBannerMobile from './pixelBannerMobile.svg'
import wordmark from './wordmark.svg'

// Temporary switch so the animated and the static art can be compared side by
// side. Collapse to one before opening the PR.
const art: 'animated' | 'static' = 'animated'

const StaticArt = () => (
  <picture className="min-h-0 flex-1">
    <source media="(min-width: 768px)" srcSet={pixelBanner} />
    <Image alt="" className="size-full object-cover" src={pixelBannerMobile} />
  </picture>
)

const AnimatedArt = () => (
  <div className="relative min-h-0 flex-1">
    <PixelPool />
    <Image
      alt=""
      className="pointer-events-none absolute left-1/2 top-1/2 w-1/5 -translate-x-1/2 -translate-y-1/2"
      src={wordmark}
    />
  </div>
)

export const HeroBanner = function () {
  const t = useTranslations('hemi-stake.hero-banner')

  return (
    <div className="flex size-full flex-col">
      <div className="flex flex-col gap-y-8 border-b border-solid border-neutral-100 p-4">
        <div className="flex items-center gap-x-1 whitespace-nowrap text-sm">
          <span className="font-medium text-orange-500">hemiStake</span>
          <span aria-hidden className="size-1 rounded-full bg-neutral-500/30" />
          <span className="text-neutral-500">{t('live-on')}</span>
        </div>
        <div className="flex w-full items-end gap-x-3">
          <h2 className="min-w-0 flex-1 leading-6.5">
            {t.rich('headline', {
              break: () => <br />,
              highlight: chunks => (
                <span className="text-orange-600">{chunks}</span>
              ),
            })}
          </h2>
          <p className="min-w-0 flex-1 text-sm text-neutral-500">
            {t('subtitle')}
          </p>
        </div>
      </div>
      {art === 'animated' ? <AnimatedArt /> : <StaticArt />}
    </div>
  )
}
