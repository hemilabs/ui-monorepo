'use client'

import { lazy, Suspense } from 'react'

const EarnCard = lazy(() =>
  import('./earnCard').then(mod => ({ default: mod.EarnCard })),
)

export const AppOverlays = () => (
  <Suspense>
    <EarnCard />
  </Suspense>
)
