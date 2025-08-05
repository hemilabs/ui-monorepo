'use client'

import { PageLayout } from 'components/pageLayout'

export default function StakingDashboardLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return <PageLayout variant="wide">{children}</PageLayout>
}
