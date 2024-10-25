import { useUmami } from 'app/analyticsEvents'
import { Card } from 'components/card'
import Image, { StaticImageData } from 'next/image'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { isRelativeUrl } from 'utils/url'

import deployContracts from '../_assets/deployContracts.png'
import swapTokens from '../_assets/swapTokens.png'
import tunnelAssets from '../_assets/tunnelAssets.png'

import { Section } from './section'

const Box = function ({
  alt,
  event,
  heading,
  href,
  image,
  subheading,
}: {
  alt: string
  event: 'tut - deploy contract' | 'tut - swap tokens' | 'tut - tunnel assets'
  heading: string
  href: string
  image: StaticImageData
  subheading: string
}) {
  const router = useRouter()
  const { track } = useUmami()

  const handleClick = function () {
    track?.(event)
    if (isRelativeUrl(href)) {
      router.push(href)
      return
    }
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="group/image flex-1 cursor-pointer" onClick={handleClick}>
      <Card>
        <div className="flex flex-col gap-y-4 p-2 pb-4 text-sm font-medium">
          <Image
            alt={alt}
            className="rounded-2xl opacity-60 group-hover/image:opacity-100"
            height={300}
            priority={true}
            src={image}
            style={{ objectFit: 'cover' }}
          />
          <div className="px-2">
            <h5 className="text-neutral-950">{heading}</h5>
            <p className="text-neutral-500">{subheading}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
export const StartUsingHemi = function () {
  const t = useTranslations('get-started')
  const locale = useLocale()
  return (
    <Section
      card={false}
      step={{
        description: t('start-using-hemi'),
        position: 3,
      }}
    >
      <div className="flex max-w-full flex-col gap-y-4 md:flex-row md:justify-between md:gap-x-6">
        <Box
          alt="Tunnel form"
          event="tut - tunnel assets"
          heading={t('tunnel-assets')}
          href={`/${locale}/tunnel`}
          image={tunnelAssets}
          subheading={t('learn-about-tunneling')}
        />
        <Box
          alt="Swap form"
          event="tut - swap tokens"
          heading={t('swap-tokens')}
          href="https://swap.hemi.xyz"
          image={swapTokens}
          subheading={t('learn-about-tunneling')}
        />
        <Box
          alt="Button with the text 'Deploy'"
          event="tut - swap tokens"
          heading={t('deploy-a-smart-contract')}
          href="https://docs.hemi.xyz/how-to-tutorials/tutorials/using-remix-ide"
          image={deployContracts}
          subheading={t('learn-to-deploy-smart-contract')}
        />
      </div>
    </Section>
  )
}
