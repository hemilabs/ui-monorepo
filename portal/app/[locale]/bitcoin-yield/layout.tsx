import { featureFlags } from 'app/featureFlags'
import { LinesBackground } from 'components/linesBackground'
import { type ReactNode } from 'react'

import NotFound from '../not-found'

type Props = {
  children: ReactNode
}

const Layout = function ({ children }: Props) {
  if (!featureFlags.enableBtcYieldPage) {
    return <NotFound />
  }

  return (
    <>
      {children}
      <div className="hidden md:block">
        <LinesBackground />
      </div>
    </>
  )
}
export default Layout
