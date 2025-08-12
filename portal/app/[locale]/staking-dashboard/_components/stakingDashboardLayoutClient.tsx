import { PageLayout } from 'components/pageLayout'
import { ReactNode } from 'react'

export default function StakingDashboardLayoutClient({
  children,
}: {
  children: ReactNode
}) {
  return <PageLayout variant="superWide">{children}</PageLayout>
}
