import { TunnelTabs } from 'components/tunnelTabs'
import { TransactionsInProgressProvider } from 'context/transactionsInProgressContext'
import { useDocumentTitle } from 'hooks/useDocumentTitle'
import { Outlet } from 'react-router'

import { ViewOperation } from './_components/viewOperation'

export const TunnelLayout = function () {
  useDocumentTitle('Tunnel | Hemi Portal')

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
