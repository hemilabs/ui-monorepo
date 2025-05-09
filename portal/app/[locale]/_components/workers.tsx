'use client'

import dynamic from 'next/dynamic'

const SyncHistoryWorkers = dynamic(
  () =>
    import('components/syncHistoryWorkers').then(mod => mod.SyncHistoryWorkers),
  { ssr: false },
)

const TunnelStatusUpdaters = dynamic(
  () =>
    import('components/tunnelStatusUpdaters').then(
      mod => mod.TunnelStatusUpdaters,
    ),
  {
    ssr: false,
  },
)

export const Workers = () => (
  <>
    <SyncHistoryWorkers />
    <TunnelStatusUpdaters />
  </>
)
