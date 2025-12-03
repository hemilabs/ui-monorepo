'use client'

import { DrawerLoader } from 'components/drawer/drawerLoader'
import { PageLayout } from 'components/pageLayout'
import dynamic from 'next/dynamic'
import Skeleton from 'react-loading-skeleton'

import { GetStartedLoader } from './_components/getStartedLoader'
import { Info } from './_components/info'
import { Integrations } from './_components/integrations'
import { TopSection } from './_components/topSection'
import { useOperationDrawer } from './_hooks/useOperationDrawer'

const YieldOperationDrawer = dynamic(
  () =>
    import('./_components/yieldOperationDrawer').then(
      mod => mod.YieldOperationDrawer,
    ),
  {
    loading: () => <DrawerLoader className="h-[95dvh] md:h-full" />,
    ssr: false,
  },
)

// Dynamically load the table because the column order depends on viewport size
// so, if we don't do this, there will be a very visible layout shift
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
