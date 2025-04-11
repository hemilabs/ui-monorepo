import type { Metadata } from 'next'
import { PropsWithChildren } from 'react'

export const metadata: Metadata = {
  title: 'Get Started | Hemi Portal',
}

export default function GetStartedLayout({ children }: PropsWithChildren) {
  return <>{children}</>
}
