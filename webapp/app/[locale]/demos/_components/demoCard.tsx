'use client'

import { ExternalLink } from 'components/externalLink'
import Image, { StaticImageData } from 'next/image'

const colorVariants = {
  black: 'text-neutral-950',
  gray: 'text-neutral-500',
  white: 'text-white',
} as const

type ColorVariant = keyof typeof colorVariants

interface Props {
  altText: string
  bgImage: StaticImageData
  href: string
  heading: string
  headingColor: ColorVariant
  icon: StaticImageData
  subHeading: string
  subHeadingColor?: ColorVariant
}

export const DemoCard = ({
  bgImage,
  href,
  altText,
  heading,
  headingColor,
  icon,
  subHeading,
  subHeadingColor,
}: Props) => (
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
      <ExternalLink className="flex h-full flex-col gap-y-1 p-6" href={href}>
        <h4 className={`mt-auto text-base ${colorVariants[headingColor]}`}>
          {heading}
        </h4>
        <p
          className={`text-ms mt-1 leading-5 ${
            colorVariants[subHeadingColor] ?? colorVariants[headingColor]
          }`}
        >
          {subHeading}
        </p>
      </ExternalLink>
    </div>
  </div>
)
