'use client'

import { PageLayout } from 'components/pageLayout'
import { PageTitle } from 'components/pageTitle'
import { useTranslations } from 'next-intl'

import { AddHemiToken } from './_components/addHemiToken'
import { AddHemiWallet } from './_components/addHemiWallet'
import { LearnMore } from './_components/learnMore'

const GetStarted = function () {
  const t = useTranslations('get-started')

  return (
    <PageLayout variant="center">
      <div className="pb-12 lg:pb-16">
        <PageTitle subtitle={t('subheading')} title={t('heading')} />
        <AddHemiWallet />
        <AddHemiToken />
        <LearnMore />
      </div>
    </PageLayout>
  )
}

export default GetStarted
