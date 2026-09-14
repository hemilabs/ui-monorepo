import { ErrorBoundary } from 'components/errorBoundary'
import { lazyWithFallback } from 'components/lazyWithFallback'
import { useNetworkType } from 'hooks/useNetworkType'
import { Suspense } from 'react'

const HemiPrice = lazyWithFallback(() =>
  import('./hemiPrice').then(mod => ({ default: mod.HemiPrice })),
)

const HemiPricePillImpl = function () {
  const [networkType] = useNetworkType()

  if (networkType === 'testnet') {
    return null
  }

  return <HemiPrice />
}

export const HemiPricePill = () => (
  <ErrorBoundary fallback={<></>}>
    <Suspense>
      <HemiPricePillImpl />
    </Suspense>
  </ErrorBoundary>
)
