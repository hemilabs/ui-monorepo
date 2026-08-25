import { PropsWithChildren } from 'react'

import StakingDashboardLayoutClient from './_components/stakingDashboardLayoutClient'

const StakingDashboardLayout = ({ children }: PropsWithChildren) => (
  <StakingDashboardLayoutClient>{children}</StakingDashboardLayoutClient>
)

export default StakingDashboardLayout
