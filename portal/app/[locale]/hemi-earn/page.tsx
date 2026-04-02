'use client'

import { PageLayout } from 'components/pageLayout'

import { EarnTable } from './_components/earnTable'
import { InfoCards } from './_components/infoCards'
import { TopSection } from './_components/topSection'

export default function Page() {
  return (
    <PageLayout variant="wide">
      <TopSection />
      <InfoCards />
      <EarnTable />
    </PageLayout>
  )
}
