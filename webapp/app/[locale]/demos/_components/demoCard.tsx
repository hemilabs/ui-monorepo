'use client'

import Image, { StaticImageData } from 'next/image'
import { Card } from 'ui-common/components/card'

interface Props {
  href: string
  imageSrc: StaticImageData
  altText: string
  heading: string
  subHeading: string
}

const ArrowDownLeftIcon = () => (
  <svg fill="none" height="25" width="24" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16 14.628V8.5H9.872M8 16.5l7.32-7.32"
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
)

export const DemoCard = ({
  href,
  imageSrc,
  altText,
  heading,
  subHeading,
}: Props) => (
  <a href={href} rel="noopener noreferrer" target="_blank">
    <Card borderColor="gray" shadow="soft">
      <div className="h-60 max-w-64 cursor-pointer">
        <div className="overflow-hidden rounded-xl border border-solid border-slate-100">
          <Image
            alt={altText}
            priority={true}
            src={imageSrc}
            style={{
              height: 'auto',
              objectFit: 'cover',
              width: '100%',
            }}
          />
        </div>
        <div className="mt-3 flex justify-between">
          <h4 className="text-base font-medium">{heading}</h4>
          <ArrowDownLeftIcon />
        </div>
        <p className="my-1 text-xs text-neutral-400">{subHeading}</p>
      </div>
    </Card>
  </a>
)
