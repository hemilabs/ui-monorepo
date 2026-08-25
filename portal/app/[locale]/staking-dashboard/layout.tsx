import { useDocumentTitle } from 'hooks/useDocumentTitle'
import { Outlet } from 'react-router'

import StakingDashboardLayoutClient from './_components/stakingDashboardLayoutClient'

const StakingDashboardLayout = function () {
  useDocumentTitle('Staking dashboard | Hemi Portal')

  return (
    <StakingDashboardLayoutClient>
      <Outlet />
    </StakingDashboardLayoutClient>
  )
}

export default StakingDashboardLayout
