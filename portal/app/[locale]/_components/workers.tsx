'use client'

import dynamic from 'next/dynamic'

const TunnelStatusUpdaters = dynamic(
  () =>
    import('components/tunnelStatusUpdaters').then(
      mod => mod.TunnelStatusUpdaters,
    ),
  {
    ssr: false,
  },
)

export const Workers = () => <TunnelStatusUpdaters />
