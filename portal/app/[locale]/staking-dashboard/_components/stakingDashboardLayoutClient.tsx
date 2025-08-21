'use client'

import NotFound from 'app/not-found'
import { PageLayout } from 'components/pageLayout'
import { useHemi } from 'hooks/useHemi'
import { ReactNode } from 'react'
import { isStakeGovernanceEnabled } from 'utils/featureFlags'

export default function StakingDashboardLayoutClient({
  children,
}: {
  children: ReactNode
}) {
  const chainId = useHemi().id
  const enabled = isStakeGovernanceEnabled(chainId)
  if (!enabled) {
    return <NotFound />
  }

  return <PageLayout variant="superWide">{children}</PageLayout>
}
