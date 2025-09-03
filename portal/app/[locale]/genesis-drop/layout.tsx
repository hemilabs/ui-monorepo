'use client'

import { PageLayout } from 'components/pageLayout'
import { useNetworkType } from 'hooks/useNetworkType'
import { ReactNode, Suspense } from 'react'

import { Background } from './_components/background'
import { ClaimRewardsDisabledTestnet } from './_components/claimRewardsDisabledTestnet'
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

const Layout = ({ children }: Props) => (
  <PageLayout variant="genesisDrop">
    <Background />
    <div className="flex w-full flex-col items-center gap-y-2">
      <Suspense>
        <Page>{children}</Page>
      </Suspense>
    </div>
  </PageLayout>
)

export default Layout
