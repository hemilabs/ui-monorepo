import { useDocumentTitle } from 'hooks/useDocumentTitle'
import { Outlet } from 'react-router'

import StakingDashboardLayoutClient from './_components/stakingDashboardLayoutClient'

export const HemiStakeLayout = function () {
  useDocumentTitle('Hemi Stake | Hemi Portal')

  return (
    <StakingDashboardLayoutClient>
      <Outlet />
    </StakingDashboardLayoutClient>
  )
}
