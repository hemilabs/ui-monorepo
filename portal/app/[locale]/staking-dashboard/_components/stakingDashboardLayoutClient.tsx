'use client'

import { PageLayout } from 'components/pageLayout'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

const StakingDashboardLayoutClient = ({ children }: Props) => (
  <PageLayout variant="superWide">{children}</PageLayout>
)

export default StakingDashboardLayoutClient
