'use client'

import { PageLayout } from 'components/pageLayout'
import { TestnetDisabled } from 'components/testnetDisabled'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTranslations } from 'next-intl'
import { ReactNode, Suspense } from 'react'

import { GenesisDropTabs } from './_components/genesisDropTabs'
import { isClaimRewardsEnabledOnTestnet } from './_utils'

type Props = {
  children: ReactNode
}

const Page = function ({ children }: Props) {
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
