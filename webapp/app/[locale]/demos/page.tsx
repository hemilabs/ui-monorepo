'use client'

import { PageTitle } from 'components/pageTitle'
import { useTranslations } from 'next-intl'

import { DemoCard } from './_components/demoCard'
import cryptoChordsImg from './_images/crypto_chords_large.png'
import cryptoChordsIcon from './_images/crypto_chords_small.svg'
import hemiHatchlingsImg from './_images/hemi_hatchlings_large.png'
import hemiHatchlingsIcon from './_images/hemi_hatchlings_small.png'
import pureFinanceImg from './_images/pure_finance_large.png'
import pureFinanceIcon from './_images/pure_finance_small.svg'

const Demos = function () {
  const t = useTranslations('demos')

  return (
    <>
      <PageTitle subtitle={t('sub-heading')} title={t('heading')} />
      <div className="mt-6 flex flex-col flex-wrap gap-x-6 gap-y-4 md:mt-8 md:flex-row md:gap-y-6">
        <DemoCard
          altText="hemi hatchlings"
          bgImage={hemiHatchlingsImg}
          heading={t('hemihatchlings.heading')}
          headingColor="white"
          href="https://testnet.hatchlings.hemi.xyz"
          icon={hemiHatchlingsIcon}
          subHeading={t('hemihatchlings.sub-heading')}
        />
        <DemoCard
          altText="cryptochords"
          bgImage={cryptoChordsImg}
          heading={t('cryptochords.heading')}
          headingColor="white"
          href="https://cryptochords.hemi.xyz"
          icon={cryptoChordsIcon}
          subHeading={t('cryptochords.sub-heading')}
        />
        <DemoCard
          altText="pure finance"
          bgImage={pureFinanceImg}
          heading={t('purefinance.heading')}
          headingColor="black"
          href="https://purefinance.hemi.xyz"
          icon={pureFinanceIcon}
          subHeading={t('purefinance.sub-heading')}
          subHeadingColor="gray"
        />
      </div>
    </>
  )
}

export default Demos
