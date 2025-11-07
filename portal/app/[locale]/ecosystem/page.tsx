'use client'

import { PageLayout } from 'components/pageLayout'
import { PageTitle } from 'components/pageTitle'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTranslations } from 'next-intl'

import { DemoCard } from './_components/demoCard'
import bitcoinKitImg from './_images/bitcoin_kit_large.png'
import bitcoinKitIcon from './_images/bitcoin_kit_small.svg'
import demosImg from './_images/demos_large.png'
import demosIcon from './_images/demos_small.png'
import pureFinanceImg from './_images/pure_finance_large.png'
import pureFinanceIcon from './_images/pure_finance_small.svg'

const Ecosystem = function () {
  const t = useTranslations('ecosystem')
  const [networkType] = useNetworkType()

  return (
    <PageLayout variant="center">
      <PageTitle subtitle={t('sub-heading')} title={t('heading')} />
      <div className="mt-6 flex flex-col flex-wrap gap-x-6 gap-y-4 md:mt-8 md:flex-row md:gap-y-6">
        <DemoCard
          altText="DEMOS - Biometric Verification"
          bgImage={demosImg}
          event="ecosystem - DEMOS"
          heading={t('demos.heading')}
          headingColor="white"
          // Same url for both Mainnet and Testnet
          href="https://app.demos.global/"
          icon={demosIcon}
          subHeading={t('demos.sub-heading')}
          subHeadingColor="white"
        />
        <DemoCard
          altText="Bitcoin Kit Demo"
          bgImage={bitcoinKitImg}
          event="ecosystem - bitcoinkit"
          heading={t('bitcoin-kit.heading')}
          headingColor="black"
          href={`https://bitcoin-kit.hemi.xyz/code-editor?networkType=${networkType}`}
          icon={bitcoinKitIcon}
          subHeading={t('bitcoin-kit.sub-heading')}
          subHeadingColor="gray"
        />
        <DemoCard
          altText="pure finance"
          bgImage={pureFinanceImg}
          event="ecosystem - pure finance"
          heading={t('purefinance.heading')}
          headingColor="black"
          href="https://pure.finance"
          icon={pureFinanceIcon}
          subHeading={t('purefinance.sub-heading')}
          subHeadingColor="gray"
        />
      </div>
    </PageLayout>
  )
}

export default Ecosystem
