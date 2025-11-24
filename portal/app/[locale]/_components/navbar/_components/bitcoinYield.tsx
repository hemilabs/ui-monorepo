import { featureFlags } from 'app/featureFlags'
import { BitcoinYieldIcon } from 'components/icons/bitcoinYieldIcon'
import { Suspense } from 'react'

import { ItemLink } from './itemLink'

const BitcoinYieldImpl = function () {
  const isEnabled = featureFlags.enableBtcYieldPage

  if (!isEnabled) {
    return null
  }

  return (
    <ItemLink
      event="nav - bitcoin yield"
      href="/bitcoin-yield"
      icon={<BitcoinYieldIcon />}
      text="Bitcoin Yield"
    />
  )
}

export const BitcoinYield = () => (
  <Suspense>
    <BitcoinYieldImpl />
  </Suspense>
)
