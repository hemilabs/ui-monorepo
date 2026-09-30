import { useNetworkType } from 'hooks/useNetworkType'
import { type ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export const MainnetOnly = function ({ children }: Props) {
  const [networkType] = useNetworkType()
  return networkType === 'mainnet' ? children : null
}
