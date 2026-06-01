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
      <PageTitle subtitle={t('subheading')} title={t('heading')} />
      <AddHemiWallet />
      <AddHemiToken />
      <LearnMore />
    </PageLayout>
  )
}

export default GetStarted
