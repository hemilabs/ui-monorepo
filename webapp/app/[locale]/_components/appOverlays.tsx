'use client'

import dynamic from 'next/dynamic'

const MainnetLiveModal = dynamic(
  () => import('components/mainnetLiveModal').then(mod => mod.MainnetLiveModal),
  {
    ssr: false,
  },
)

const StakeAndEarnCard = dynamic(
  () => import('./earnCard').then(mod => mod.EarnCard),
  {
    ssr: false,
  },
)

export const AppOverlays = () => (
  <>
    <StakeAndEarnCard />
    <MainnetLiveModal />
  </>
)
