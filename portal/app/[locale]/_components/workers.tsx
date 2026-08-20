'use client'

import { lazy, Suspense } from 'react'

const SyncHistoryWorkers = lazy(() =>
  import('components/syncHistoryWorkers').then(mod => ({
    default: mod.SyncHistoryWorkers,
  })),
)

const TunnelStatusUpdaters = lazy(() =>
  import('components/tunnelStatusUpdaters').then(mod => ({
    default: mod.TunnelStatusUpdaters,
  })),
)

export const Workers = () => (
  <>
    <Suspense>
      <SyncHistoryWorkers />
    </Suspense>
    <Suspense>
      <TunnelStatusUpdaters />
    </Suspense>
  </>
)
