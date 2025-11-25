'use client'

import { featureFlags } from 'app/featureFlags'
import { LinesBackground } from 'components/linesBackground'
import { useNetworkType } from 'hooks/useNetworkType'
import { type ReactNode } from 'react'

import NotFound from '../not-found'

import { BitcoinYieldDisabledTestnet } from './_components/bitcoinYieldDisabledTestnet'
import { isBitcoinYieldEnabledOnTestnet } from './_utils'

type Props = {
  children: ReactNode
}

const Layout = function ({ children }: Props) {
  const [networkType] = useNetworkType()

  if (!featureFlags.enableBtcYieldPage) {
    return <NotFound />
  }

  if (!isBitcoinYieldEnabledOnTestnet(networkType)) {
    return <BitcoinYieldDisabledTestnet />
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
