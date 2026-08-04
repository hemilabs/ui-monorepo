'use client'

import { featureFlags } from 'app/featureFlags'
import { PageLayout } from 'components/pageLayout'
import { TestnetDisabled } from 'components/testnetDisabled'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTranslations } from 'next-intl'
import { type ReactNode } from 'react'

import NotFound from '../not-found'

import { EarnStatusUpdaters } from './_components/earnStatusUpdaters'
import { TopSection } from './_components/topSection'
import { LocalEarnOperationsProvider } from './_context/localEarnOperationsContext'

type Props = {
  children: ReactNode
}

const Layout = function ({ children }: Props) {
  const [networkType] = useNetworkType()
  const t = useTranslations('hemi-earn')

  if (!featureFlags.enableHemiEarnPage) {
    return <NotFound />
  }

  if (networkType === 'testnet') {
    return (
      <PageLayout variant="wide">
        <TopSection />
        <TestnetDisabled subtitle={t('switch-to-start-earning')} />
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
