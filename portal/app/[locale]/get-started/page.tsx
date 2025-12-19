'use client'

import { PageLayout } from 'components/pageLayout'
import { useTranslations } from 'next-intl'

import { AddHemiWallet } from './_components/addHemiWallet'
import { FundWallet } from './_components/fundWallet'
import { LearnMore } from './_components/learnMore'
import { StartUsingHemi } from './_components/startUsingHemi'

const GetStarted = function () {
  const t = useTranslations('get-started')

  return (
    <PageLayout variant="center">
      <h1 className="mb-1 text-4xl font-medium text-neutral-950">
        {t('heading')}
      </h1>
      <p className="font-medium text-neutral-600">{t('subheading')}</p>
      <AddHemiWallet />
      <FundWallet />
      <StartUsingHemi />
      <div className="mt-12 pb-14">
        <LearnMore />
      </div>
    </PageLayout>
  )
}

export default GetStarted
