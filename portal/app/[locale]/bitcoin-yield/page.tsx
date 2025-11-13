'use client'

import { PageLayout } from 'components/pageLayout'

import { GetStartedLoader } from './_components/getStartedLoader'
import { Info } from './_components/info'
import { PoolTable } from './_components/poolTable'
import { TopSection } from './_components/topSection'

export default function Page() {
  return (
    <PageLayout variant="wide">
      <TopSection />
      <GetStartedLoader />
      <Info />
      <PoolTable />
    </PageLayout>
  )
}
