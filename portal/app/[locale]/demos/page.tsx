'use client'

import { hemi } from 'app/networks'
import { useTranslations } from 'next-intl'

import cryptochordsImg from '../../../public/demos/cryptochords.png'
import hemihatchlingsImg from '../../../public/demos/hemihatchlings.png'
import purefinanceImg from '../../../public/demos/purefinance.png'

import { DemoCard } from './_components/demoCard'

const GraduateCapIcon = () => (
  <svg fill="none" height="29" width="36" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7.5 13v8.25l10.499 5.25L28.5 21.25V13m5.999-1.5v9m-16.5-18L3.299 10l14.7 7.5 14.7-7.5-14.7-7.5Z"
      stroke="#FF6C15"
      strokeLinecap="square"
      strokeWidth="3"
    />
  </svg>
)

const Demos = function () {
  const t = useTranslations('demos')

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col items-start">
        <div className="flex items-center">
          <GraduateCapIcon />
          <h1 className="ml-2 text-4xl font-medium">{t('heading')}</h1>
        </div>
        <p className="mb-14 mt-3 text-sm text-neutral-400">
          {t('sub-heading')}
        </p>
        <main
          className="flex flex-col gap-y-4 md:w-full 
          md:flex-row md:justify-center md:gap-x-4"
        >
          <DemoCard
            altText="hemi hatchlings"
            heading={t('hemihatchlings.heading')}
            href={
              hemi.testnet
                ? 'https://hemihatchlings-test.hemi.xyz'
                : 'https://hemihatchlings.hemi.xyz'
            }
            imageSrc={hemihatchlingsImg}
            subHeading={t('hemihatchlings.sub-heading')}
          />
          <DemoCard
            altText="cryptochords"
            heading={t('cryptochords.heading')}
            href="https://cryptochords.hemi.xyz"
            imageSrc={cryptochordsImg}
            subHeading={t('cryptochords.sub-heading')}
          />
          <DemoCard
            altText="pure finance"
            heading={t('purefinance.heading')}
            href="https://hemi.xyz/pure.finance"
            imageSrc={purefinanceImg}
            subHeading={t('purefinance.sub-heading')}
          />
        </main>
      </div>
    </div>
  )
}

export default Demos
