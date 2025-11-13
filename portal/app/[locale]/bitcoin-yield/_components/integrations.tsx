import { Card } from 'components/card'
import Image, { StaticImageData } from 'next/image'
import { useTranslations } from 'next-intl'

import { usePoolAsset } from '../_hooks/usePoolAsset'

import gearboxLogo from './images/gearbox.png'
import spectraLogo from './images/spectra.svg'

type IntegrationProps = {
  category: string
  description: string
  logo: StaticImageData
  name: string
}

const Integration = ({
  category,
  description,
  logo,
  name,
}: IntegrationProps) => (
  <Card>
    <div className="flex w-full flex-col gap-y-1 p-6">
      <div className="relative size-12 rounded-md bg-neutral-900 ">
        <Image
          alt={`${name} logo`}
          className="px-2.5"
          fill
          objectFit="contain"
          src={logo}
        />
      </div>
      <p className="body-text-caption mt-5 text-orange-500">{category}</p>
      <h2 className="text-neutral-950">{name}</h2>
      <p className="body-text-normal mt-1 text-neutral-500">{description}</p>
    </div>
  </Card>
)
export const Integrations = function () {
  const { data: poolAsset } = usePoolAsset()
  const t = useTranslations('bitcoin-yield.integrations')

  return (
    <section className="mt-12 flex flex-col gap-y-5 md:mt-14 md:gap-y-6">
      <h3>{t('heading', { symbol: poolAsset.symbol })}</h3>
      <div className="xs:flex-row flex w-full flex-col flex-wrap gap-4 md:flex-nowrap md:gap-5 [&>.card-container]:w-full [&>.card-container]:max-md:basis-[calc(50%-theme(spacing.2))]">
        <Integration
          category={t('categories.defi')}
          description={t('spectra-description')}
          logo={spectraLogo}
          name="Spectra"
        />
        <Integration
          category={t('categories.lending-market')}
          description={t('gearbox-description')}
          logo={gearboxLogo}
          name="Gearbox"
        />
      </div>
    </section>
  )
}
