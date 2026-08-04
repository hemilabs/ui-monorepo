'use client'

import { featureFlags } from 'app/featureFlags'
import { PageLayout } from 'components/pageLayout'
import { useNetworkType } from 'hooks/useNetworkType'
import { type ReactNode } from 'react'

import NotFound from '../not-found'

import { EarnDisabledTestnet } from './_components/earnDisabledTestnet'
import { EarnStatusUpdaters } from './_components/earnStatusUpdaters'
import { TopSection } from './_components/topSection'
import { LocalEarnOperationsProvider } from './_context/localEarnOperationsContext'

type Props = {
  children: ReactNode
}

const Layout = function ({ children }: Props) {
  const [networkType] = useNetworkType()

  if (!featureFlags.enableHemiEarnPage) {
    return <NotFound />
  }

  if (networkType === 'testnet') {
    return (
      <PageLayout variant="wide">
        <TopSection />
        <EarnDisabledTestnet />
      </PageLayout>
    )
  }

  return (
    <LocalEarnOperationsProvider>
      <EarnStatusUpdaters />
      {children}
    </LocalEarnOperationsProvider>
  )
}
export default Layout
