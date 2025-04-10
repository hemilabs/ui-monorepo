import { TunnelTabs } from 'components/tunnelTabs'
import { TransactionsInProgressProvider } from 'context/transactionsInProgressContext'
import { Metadata } from 'next'

import { ViewOperation } from './_components/viewOperation'

export const metadata: Metadata = {
  title: 'Tunnel | Hemi Portal',
}

type Props = {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  return (
    <TransactionsInProgressProvider>
      <div className="mb-4 mt-5 md:hidden">
        <TunnelTabs />
      </div>
      {children}
      <ViewOperation />
    </TransactionsInProgressProvider>
  )
}
