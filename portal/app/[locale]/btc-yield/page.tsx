'use client'

import { PageLayout } from 'components/pageLayout'
import dynamic from 'next/dynamic'
import Skeleton from 'react-loading-skeleton'

import { GetStartedLoader } from './_components/getStartedLoader'
import { Info } from './_components/info'
import { Integrations } from './_components/integrations'
import { TopSection } from './_components/topSection'
import { YieldOperationDrawer } from './_components/yieldOperationDrawer'
import { useOperationDrawer } from './_hooks/useOperationDrawer'

const PoolTable = dynamic(
  () => import('./_components/poolTable').then(mod => mod.PoolTable),
  {
    loading: () => <Skeleton className="h-17 mt-8 w-full rounded-xl" />,
    ssr: false,
  },
)

export default function Page() {
  const [operation] = useOperationDrawer()
  return (
    <PageLayout variant="wide">
      <TopSection />
      <GetStartedLoader />
      <Info />
      <PoolTable />
      <Integrations />
      {!!operation && <YieldOperationDrawer />}
    </PageLayout>
  )
}
