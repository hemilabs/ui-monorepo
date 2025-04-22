import type { Metadata } from 'next'
import { PropsWithChildren } from 'react'

export const metadata: Metadata = {
  title: 'Demos | Hemi Portal',
}

export default function DemosLayout({ children }: PropsWithChildren) {
  return <>{children}</>
}
