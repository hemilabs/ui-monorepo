import { useNetworkType } from 'hooks/useNetworkType'
import { Suspense } from 'react'

const UI = function () {
  const [networkType] = useNetworkType()
  if (networkType !== 'testnet') {
    return null
  }

  return (
    <span
      className="absolute left-1/2 z-10 -translate-x-1/2 rounded-b bg-orange-600
    px-2 text-sm font-medium text-white"
    >
      Testnet
    </span>
  )
}

export const TestnetIndicator = () => (
  // No fallback needed
  <Suspense>
    <UI />
  </Suspense>
)
