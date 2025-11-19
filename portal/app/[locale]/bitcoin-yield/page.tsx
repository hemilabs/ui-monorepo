'use client'

import { DrawerLoader } from 'components/drawer/drawerLoader'
import { PageLayout } from 'components/pageLayout'
import dynamic from 'next/dynamic'

import { GetStartedLoader } from './_components/getStartedLoader'
import { Info } from './_components/info'
import { Integrations } from './_components/integrations'
import { PoolTable } from './_components/poolTable'
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
