import { lazyWithFallback } from 'components/lazyWithFallback'

const EarnCard = lazyWithFallback(() =>
  import('./earnCard').then(mod => ({ default: mod.EarnCard })),
)

const HemiStakeCard = lazyWithFallback(() =>
  import('./hemiStakeCard').then(mod => ({ default: mod.HemiStakeCard })),
)

// Both cards dock to the same corner, so the Merkl one waits its turn while the
// hemiStake launch card is up.
const showEarnCard = false

export const AppOverlays = () => (
  <>
    <HemiStakeCard />
    {showEarnCard && <EarnCard />}
  </>
)
