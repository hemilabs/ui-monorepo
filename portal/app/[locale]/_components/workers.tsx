'use client'

import { lazyWithFallback } from 'components/lazyWithFallback'

const SyncHistoryWorkers = lazyWithFallback(() =>
  import('components/syncHistoryWorkers').then(mod => ({
    default: mod.SyncHistoryWorkers,
  })),
)

const TunnelStatusUpdaters = lazyWithFallback(() =>
  import('components/tunnelStatusUpdaters').then(mod => ({
    default: mod.TunnelStatusUpdaters,
  })),
)

export const Workers = () => (
  <>
    <SyncHistoryWorkers />
    <TunnelStatusUpdaters />
  </>
)
