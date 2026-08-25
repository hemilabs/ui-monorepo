import { useDocumentTitle } from 'hooks/useDocumentTitle'
import { PropsWithChildren } from 'react'

import StakingDashboardLayoutClient from './_components/stakingDashboardLayoutClient'

const StakingDashboardLayout = function ({ children }: PropsWithChildren) {
  useDocumentTitle('Staking dashboard | Hemi Portal')

  return <StakingDashboardLayoutClient>{children}</StakingDashboardLayoutClient>
}

export default StakingDashboardLayout
