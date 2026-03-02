'use client'

import { PageLayout } from 'components/pageLayout'
import { PageTitle } from 'components/pageTitle'
import { useTranslations } from 'next-intl'

import { AddHemiWallet } from './_components/addHemiWallet'
import { FundWallet } from './_components/fundWallet'
import { LearnMore } from './_components/learnMore'
import { StartUsingHemi } from './_components/startUsingHemi'

const GetStarted = function () {
  const t = useTranslations('get-started')

  return (
    <PageLayout variant="center">
      <PageTitle subtitle={t('subheading')} title={t('heading')} />
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
