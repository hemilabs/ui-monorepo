'use client'

import { featureFlags } from 'app/featureFlags'
import { type ReactNode } from 'react'

import NotFound from '../not-found'

type Props = {
  children: ReactNode
}

const Layout = function ({ children }: Props) {
  if (!featureFlags.enableHemiEarnPage) {
    return <NotFound />
  }

  return <>{children}</>
}
export default Layout
