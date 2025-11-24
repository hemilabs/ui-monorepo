import { featureFlags } from 'app/featureFlags'
import { BitcoinYieldIcon } from 'components/icons/bitcoinYieldIcon'
import { useTranslations } from 'next-intl'
import { Suspense } from 'react'

import { ItemLink } from './itemLink'

const BitcoinYieldImpl = function () {
  const t = useTranslations('navbar')

  const isEnabled = featureFlags.enableBtcYieldPage

  if (!isEnabled) {
    return null
  }

  return (
    <ItemLink
      event="nav - bitcoin yield"
      href="/bitcoin-yield"
      icon={<BitcoinYieldIcon />}
      text={t('bitcoin-yield')}
    />
  )
}

export const BitcoinYield = () => (
  <Suspense>
    <BitcoinYieldImpl />
  </Suspense>
)
