'use client'

import { useTranslations } from 'next-intl'
import { Tabs, Tab } from 'ui-common/components/tabs'

import { useActiveTab } from './_hooks/useActiveTab'

type Props = {
  children: React.ReactNode
}
export default function Layout({ children }: Props) {
  const activeTab = useActiveTab()
  const t = useTranslations('tunnel-page')

  // TODO Implement connect modal https://github.com/BVM-priv/ui-monorepo/issues/159
  return (
    <>
      <div className="mb-3 flex justify-center">
        <Tabs>
          <Tab href="/tunnel" selected={activeTab == null}>
            {t('title')}
          </Tab>
          <Tab href="/tunnel?tab=history" selected={activeTab === 'history'}>
            {t('transaction-history.title')}
          </Tab>
        </Tabs>
      </div>
      {children}
    </>
  )
}
