'use client'

import { lazyWithFallback } from 'components/lazyWithFallback'

const EarnCard = lazyWithFallback(() =>
  import('./earnCard').then(mod => ({ default: mod.EarnCard })),
)

export const AppOverlays = () => <EarnCard />
