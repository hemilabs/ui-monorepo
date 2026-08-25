'use client'

import { featureFlags } from 'app/featureFlags'
import { PageLayout } from 'components/pageLayout'
import { TestnetDisabled } from 'components/testnetDisabled'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTranslations } from 'next-intl'
import { Outlet } from 'react-router'

import NotFound from '../not-found'

import { EarnStatusUpdaters } from './_components/earnStatusUpdaters'
import { TopSection } from './_components/topSection'
import { LocalEarnOperationsProvider } from './_context/localEarnOperationsContext'

const Layout = function () {
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
      <Outlet />
    </LocalEarnOperationsProvider>
  )
}
export default Layout
