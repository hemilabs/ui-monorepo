import { lazyWithFallback } from 'components/lazyWithFallback'

const EarnCard = lazyWithFallback(() =>
  import('./earnCard').then(mod => ({ default: mod.EarnCard })),
)

// The Merkl earn card is parked for now.
const showEarnCard = false

export const AppOverlays = () => <>{showEarnCard && <EarnCard />}</>
