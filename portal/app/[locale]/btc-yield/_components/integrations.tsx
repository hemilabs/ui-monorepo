import { Card } from 'components/card'
import { ExternalLink } from 'components/externalLink'
import Image, { StaticImageData } from 'next/image'
import { useTranslations } from 'next-intl'
import { type ComponentProps } from 'react'

import { usePoolAsset } from '../_hooks/usePoolAsset'

import gearboxLogo from './images/gearbox.png'
import spectraLogo from './images/spectra.svg'

type IntegrationProps = {
  category: string
  description: string
  logo: StaticImageData
  name: string
} & Pick<ComponentProps<typeof ExternalLink>, 'href'>

const Integration = ({
  category,
  description,
  href,
  logo,
  name,
}: IntegrationProps) => (
  <div className="w-full cursor-pointer [&:hover_.card-container]:shadow-lg [&_.card-container]:transition-shadow [&_.card-container]:duration-200">
    <Card>
      <ExternalLink href={href}>
        <span className="flex w-full flex-col gap-y-1 p-6">
          <span className="relative size-12 rounded-md bg-neutral-900 ">
            <Image
              alt={`${name} logo`}
              className="px-2.5"
              fill
              src={logo}
              style={{ objectFit: 'contain' }}
            />
          </span>
          <p className="body-text-caption mt-5 text-orange-600">{category}</p>
          <h2 className="text-neutral-950">{name}</h2>
          <p className="body-text-normal mt-1 text-neutral-500">
            {description}
          </p>
        </span>
      </ExternalLink>
    </Card>
  </div>
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
          href="https://app.spectra.finance/trade-yield/hemi:0xd4348231bf5e84eb6d663ecd184fa6384c114cfd"
          logo={spectraLogo}
          name="Spectra"
        />
        <Integration
          category={t('categories.lending-market')}
          description={t('gearbox-description')}
          href="https://app.gearbox.finance/pools"
          logo={gearboxLogo}
          name="Gearbox"
        />
      </div>
    </section>
  )
}
