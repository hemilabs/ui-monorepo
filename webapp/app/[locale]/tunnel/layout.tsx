'use client'

import { useSelectedLayoutSegment } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Tabs, Tab } from 'ui-common/components/tabs'

type Props = {
  children: React.ReactNode
}
export default function Layout({ children }: Props) {
  const segment = useSelectedLayoutSegment()
  const t = useTranslations('tunnel-page')

  // TODO Implement connect modal https://github.com/BVM-priv/ui-monorepo/issues/159
  return (
    <>
      <div className="mb-3 flex justify-center">
        <Tabs>
          <Tab href="/tunnel" selected={segment === null}>
            {t('title')}
          </Tab>
          <Tab
            href="/tunnel/transaction-history"
            selected={segment === 'transaction-history'}
          >
            {t('transaction-history.title')}
          </Tab>
        </Tabs>
      </div>
      {children}
    </>
  )
}
