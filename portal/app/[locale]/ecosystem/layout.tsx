import type { Metadata } from 'next'
import { PropsWithChildren } from 'react'

export const metadata: Metadata = {
  title: 'Ecosystem | Hemi Portal',
}

export default function EcosystemLayout({ children }: PropsWithChildren) {
  return <>{children}</>
}
