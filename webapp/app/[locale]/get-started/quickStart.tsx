'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Card } from 'ui-common/components/card'

const ArrowIcon = () => (
  <svg
    fill="none"
    height="16"
    viewBox="0 0 17 16"
    width="17"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13 4V10.5C13 10.6326 12.9474 10.7598 12.8536 10.8536C12.7598 10.9473 12.6326 11 12.5 11C12.3674 11 12.2403 10.9473 12.1465 10.8536C12.0527 10.7598 12 10.6326 12 10.5V5.20688L4.85378 12.3538C4.75996 12.4476 4.63272 12.5003 4.50003 12.5003C4.36735 12.5003 4.2401 12.4476 4.14628 12.3538C4.05246 12.2599 3.99976 12.1327 3.99976 12C3.99976 11.8673 4.05246 11.7401 4.14628 11.6463L11.2932 4.5H6.00003C5.86743 4.5 5.74025 4.44732 5.64648 4.35355C5.55271 4.25979 5.50003 4.13261 5.50003 4C5.50003 3.86739 5.55271 3.74021 5.64648 3.64645C5.74025 3.55268 5.86743 3.5 6.00003 3.5H12.5C12.6326 3.5 12.7598 3.55268 12.8536 3.64645C12.9474 3.74021 13 3.86739 13 4Z"
      fill="white"
    />
  </svg>
)

const InfoBox = ({
  imageSrc,
  text,
  title,
}: {
  imageSrc: string
  text: string
  title: string
}) => (
  <Card>
    <div className="flex flex-row flex-wrap justify-between md:w-40 md:flex-col md:gap-y-2">
      <div className="relative h-24 w-28 md:w-full">
        <Image
          alt="documentation background image"
          className="rounded-lg object-cover"
          fill
          src={imageSrc}
        />
      </div>
      <div className="flex flex-shrink basis-1/2 flex-col">
        <h5 className="h-fit text-base font-bold md:text-xl">{title}</h5>
        <p className="text-sm font-normal text-neutral-600 md:text-base">
          {text}
        </p>
        <a className="flex w-fit cursor-pointer items-center justify-center self-end rounded-md bg-black px-2 py-1 text-white hover:bg-black/75">
          <ArrowIcon />
        </a>
      </div>
    </div>
  </Card>
)

export const QuickStart = function () {
  const t = useTranslations('get-started')
  return (
    <section className="py-4">
      <h3 className="py-7 text-2xl font-bold md:text-3xl">
        {t('network.your-quick-starter')}
      </h3>
      <div className="flex flex-col gap-y-4 md:flex-row md:flex-wrap md:gap-x-5 xl:gap-x-6">
        <InfoBox
          imageSrc="/tunnel-and-swap.jpeg"
          text={t('network.tunnel-and-swap-description')}
          title={t('home.tunnel-and-swap')}
        />
        <InfoBox
          imageSrc="/documentation.jpeg"
          text={t('network.dive-into-docs')}
          title={t('network.documentation')}
        />
        <InfoBox
          imageSrc="/technology.jpeg"
          text={t('network.dive-into-architecture')}
          title={t('network.technology')}
        />
        <InfoBox
          imageSrc="/learn.jpeg"
          text={t('network.learn-with-tutorials')}
          title={t('network.learn')}
        />
      </div>
    </section>
  )
}
