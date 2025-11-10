'use client'

import { PageLayout } from 'components/pageLayout'

import { GetStarted } from './_components/getStarted'
import { Info } from './_components/info'
import { TopSection } from './_components/topSection'

export default function Page() {
  return (
    <PageLayout variant="wide">
      <TopSection />
      <GetStarted />
      <Info />
    </PageLayout>
  )
}
