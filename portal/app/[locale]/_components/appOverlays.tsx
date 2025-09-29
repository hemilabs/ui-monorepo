'use client'

import dynamic from 'next/dynamic'

const EarnCard = dynamic(() => import('./earnCard').then(mod => mod.EarnCard), {
  ssr: false,
})

export const AppOverlays = () => <EarnCard />
