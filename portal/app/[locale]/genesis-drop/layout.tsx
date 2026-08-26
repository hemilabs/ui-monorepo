'use client'

import { PageLayout } from 'components/pageLayout'
import { TestnetDisabled } from 'components/testnetDisabled'
import { useNetworkType } from 'hooks/useNetworkType'
import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { useTranslations } from 'use-intl'

import { GenesisDropTabs } from './_components/genesisDropTabs'
import { isClaimRewardsEnabledOnTestnet } from './_utils'

const Page = function () {
  const [networkType] = useNetworkType()
  const t = useTranslations('genesis-drop')

  if (!isClaimRewardsEnabledOnTestnet(networkType)) {
    return (
      <TestnetDisabled
        subtitle={t('switch-to-start-claiming')}
        variant="overlay"
      />
    )
  }

  return <Outlet />
}

const Tabs = function () {
  const [networkType] = useNetworkType()
  return isClaimRewardsEnabledOnTestnet(networkType) ? (
    <div className="mb-4 mt-5 md:hidden">
      <GenesisDropTabs />
    </div>
  ) : null
}

export const GenesisDropLayout = () => (
  <>
    <Tabs />
    <PageLayout variant="genesisDrop">
      <div className="flex w-full flex-col items-center gap-y-2">
        <Suspense>
          <Page />
        </Suspense>
      </div>
    </PageLayout>
  </>
)
