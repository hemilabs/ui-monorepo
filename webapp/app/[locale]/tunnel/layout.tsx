import { TunnelTabs } from 'components/tunnelTabs'
import { TransactionsInProgressProvider } from 'context/transactionsInProgressContext'

import { ViewOperation } from './_components/viewOperation'

type Props = {
  children: React.ReactNode
}

const Layout = ({ children }: Props) => (
  <TransactionsInProgressProvider>
    {/* only visible in mobile, for larger viewports check header.tsx */}
    <div className="mb-4 mt-5 md:hidden">
      <TunnelTabs />
    </div>
    {children}
    <ViewOperation />
  </TransactionsInProgressProvider>
)

export default Layout
