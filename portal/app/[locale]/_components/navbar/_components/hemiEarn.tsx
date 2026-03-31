import { featureFlags } from 'app/featureFlags'
import { HemiEarnIcon } from 'components/icons/hemiEarnIcon'
import { Suspense } from 'react'

import { ItemLink } from './itemLink'

const HemiEarnImpl = function () {
  if (!featureFlags.enableHemiEarnPage) {
    return null
  }

  return (
    <ItemLink
      event="nav - hemi earn"
      href="/hemi-earn"
      icon={<HemiEarnIcon />}
      text="Hemi Earn"
    />
  )
}

export const HemiEarn = () => (
  <Suspense>
    <HemiEarnImpl />
  </Suspense>
)
