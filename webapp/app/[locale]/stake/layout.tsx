import { Metadata } from 'next'

import StakeLayoutClient from './_components/stakeLayoutClient'

export const metadata: Metadata = {
  title: 'Stake | Hemi Portal',
}

export default function StakeLayout(props: { children: React.ReactNode }) {
  return <StakeLayoutClient {...props} />
}
