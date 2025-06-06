'use client'

import { AnalyticsEventsWithChain } from 'app/analyticsEvents'
import { ExternalLink } from 'components/externalLink'
import { useNetworkType } from 'hooks/useNetworkType'
import { useUmami } from 'hooks/useUmami'
import Image, { StaticImageData } from 'next/image'

const colorVariants = {
  black: 'text-neutral-950',
  gray: 'text-neutral-500',
  white: 'text-white',
} as const

type ColorVariant = keyof typeof colorVariants

type Props = {
  altText: string
  bgImage: StaticImageData
  event: AnalyticsEventsWithChain
  href: string
  heading: string
  headingColor: ColorVariant
  icon: StaticImageData
  subHeading: string
  subHeadingColor?: ColorVariant
}

export const DemoCard = function ({
  altText,
  bgImage,
  event,
  heading,
  headingColor,
  href,
  icon,
  subHeading,
  subHeadingColor,
}: Props) {
  const [networkType] = useNetworkType()
  const { track } = useUmami()

  const addTracking = () =>
    track ? () => track(event, { chain: networkType }) : undefined

  return (
    <div
      className="solid group/demo-card relative h-[270px] flex-shrink
    flex-grow rounded-[17px] border border-neutral-300/55
    hover:cursor-pointer md:h-56 md:w-[295px] md:flex-shrink-0 md:flex-grow-0"
    >
      <div className="absolute left-6 top-5 -z-10 h-12 w-12">
        <Image alt={altText} fill priority={true} src={icon} />
      </div>
      <Image
        alt={altText}
        className="group-hover/demo-card:opacity-88 -z-20 rounded-2xl duration-150"
        fill
        priority={true}
        src={bgImage}
        style={{ objectFit: 'cover' }}
      />
      <div className="h-full">
        <ExternalLink
          className="flex h-full flex-col gap-y-1 p-6"
          href={href}
          onClick={addTracking()}
        >
          <h4 className={`mt-auto text-base ${colorVariants[headingColor]}`}>
            {heading}
          </h4>
          <p
            className={`mt-1 text-sm font-medium ${
              colorVariants[subHeadingColor ?? headingColor]
            }`}
          >
            {subHeading}
          </p>
        </ExternalLink>
      </div>
    </div>
  )
}
