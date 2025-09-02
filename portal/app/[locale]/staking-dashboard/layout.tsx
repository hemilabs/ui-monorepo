import { Metadata } from 'next'
import { PropsWithChildren } from 'react'

import StakingDashboardLayoutClient from './_components/stakingDashboardLayoutClient'

export const metadata: Metadata = {
  title: 'Staking dashboard | Hemi Portal',
}

const StakingDashboardLayout = ({ children }: PropsWithChildren) => (
  <StakingDashboardLayoutClient>{children}</StakingDashboardLayoutClient>
)

export default StakingDashboardLayout
