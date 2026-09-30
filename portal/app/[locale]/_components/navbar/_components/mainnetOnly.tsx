import { useNetworkType } from 'hooks/useNetworkType'
import { type ReactNode, Suspense } from 'react'

type Props = {
  children: ReactNode
}

const MainnetOnlyImpl = function ({ children }: Props) {
  const [networkType] = useNetworkType()
  return networkType === 'mainnet' ? children : null
}

// The static render defaults to mainnet, so the children are the fallback
export const MainnetOnly = ({ children }: Props) => (
  <Suspense fallback={children}>
    <MainnetOnlyImpl>{children}</MainnetOnlyImpl>
  </Suspense>
)
