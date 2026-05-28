'use client'

import { featureFlags } from 'app/featureFlags'
import { type ReactNode } from 'react'

import NotFound from '../not-found'

import { EarnStatusUpdaters } from './_components/earnStatusUpdaters'
import { LocalEarnOperationsProvider } from './_context/localEarnOperationsContext'

type Props = {
  children: ReactNode
}

const Layout = function ({ children }: Props) {
  if (!featureFlags.enableHemiEarnPage) {
    return <NotFound />
  }

  return (
    <LocalEarnOperationsProvider>
      <EarnStatusUpdaters />
      {children}
    </LocalEarnOperationsProvider>
  )
}
export default Layout
