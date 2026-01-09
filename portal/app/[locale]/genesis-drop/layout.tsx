'use client'

import { PageLayout } from 'components/pageLayout'
import { useNetworkType } from 'hooks/useNetworkType'
import { ReactNode, Suspense } from 'react'

import { ClaimRewardsDisabledTestnet } from './_components/claimRewardsDisabledTestnet'
import { GenesisDropTabs } from './_components/genesisDropTabs'
import { isClaimRewardsEnabledOnTestnet } from './_utils'

type Props = {
  children: ReactNode
}

const Page = function ({ children }: Props) {
  const [networkType] = useNetworkType()

  if (!isClaimRewardsEnabledOnTestnet(networkType)) {
    return <ClaimRewardsDisabledTestnet />
  }

  return children
}

const Tabs = function () {
  const [networkType] = useNetworkType()
  return isClaimRewardsEnabledOnTestnet(networkType) ? (
    <div className="mb-4 mt-5 md:hidden">
      <GenesisDropTabs />
    </div>
  ) : null
}

const Layout = ({ children }: Props) => (
  <>
    <Tabs />
    <PageLayout variant="genesisDrop">
      <div className="flex w-full flex-col items-center gap-y-2">
        <Suspense>
          <Page>{children}</Page>
        </Suspense>
      </div>
    </PageLayout>
  </>
)

export default Layout
