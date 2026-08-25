import { TunnelTabs } from 'components/tunnelTabs'
import { TransactionsInProgressProvider } from 'context/transactionsInProgressContext'
import { useDocumentTitle } from 'hooks/useDocumentTitle'
import { useTranslations } from 'next-intl'
import { Outlet } from 'react-router'

import { ViewOperation } from './_components/viewOperation'

export const TunnelLayout = function () {
  const t = useTranslations()

  useDocumentTitle(`${t('tunnel-page.title')} | ${t('metadata.title')}`)

  return (
    <TransactionsInProgressProvider>
      <div className="mb-4 mt-5 md:hidden">
        <TunnelTabs />
      </div>
      <Outlet />
      <ViewOperation />
    </TransactionsInProgressProvider>
  )
}
