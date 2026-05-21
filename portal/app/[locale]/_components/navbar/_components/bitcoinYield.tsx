import { BitcoinYieldIcon } from 'components/icons/bitcoinYieldIcon'
import { Suspense } from 'react'

import { ItemLink } from './itemLink'

export const BitcoinYield = () => (
  <Suspense>
    <ItemLink
      event="nav - bitcoin yield"
      href="/btc-yield"
      icon={<BitcoinYieldIcon />}
      text="Bitcoin Yield"
    />
  </Suspense>
)
