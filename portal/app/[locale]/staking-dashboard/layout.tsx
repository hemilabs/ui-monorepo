import { Metadata } from 'next'
import { PropsWithChildren, Suspense } from 'react'

import StakingDashboardLayoutClient from './_components/stakingDashboardLayoutClient'

export const metadata: Metadata = {
  title: 'Staking dashboard | Hemi Portal',
}

export default function StakingDashboardLayout({
  children,
}: PropsWithChildren) {
  return (
    <Suspense>
      <StakingDashboardLayoutClient>{children}</StakingDashboardLayoutClient>
    </Suspense>
  )
}
