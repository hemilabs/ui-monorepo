'use client'

import NotFound from 'app/not-found'
import { PageLayout } from 'components/pageLayout'
import { useHemi } from 'hooks/useHemi'
import { useNetworkType } from 'hooks/useNetworkType'
import { ReactNode, Suspense } from 'react'
import { isGenesisDropEnabled } from 'utils/featureFlags'

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

const LayoutImpl = function ({ children }: Props) {
  const hemi = useHemi()
  const genesisEnabled = isGenesisDropEnabled(hemi.id)

  if (!genesisEnabled) {
    return <NotFound />
  }

  return (
    <PageLayout variant="wide">
      <Background />
      <div className="flex w-full flex-col items-center gap-y-2">
        <Page>{children}</Page>
      </div>
    </PageLayout>
  )
}

export default function Layout({ children }: Props) {
  return (
    <Suspense>
      <LayoutImpl>{children}</LayoutImpl>
    </Suspense>
  )
}
