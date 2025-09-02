'use client'

import { PageLayout } from 'components/pageLayout'
import { ReactNode } from 'react'

const StakingDashboardLayoutClient = ({
  children,
}: {
  children: ReactNode
}) => <PageLayout variant="superWide">{children}</PageLayout>

export default StakingDashboardLayoutClient
