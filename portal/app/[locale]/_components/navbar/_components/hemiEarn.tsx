import { HemiEarnIcon } from 'components/icons/hemiEarnIcon'
import { Suspense } from 'react'

import { ItemLink } from './itemLink'

export const HemiEarn = () => (
  <Suspense>
    <ItemLink
      event="nav - hemi earn"
      href="/hemi-earn"
      icon={<HemiEarnIcon />}
      text="Hemi Earn"
    />
  </Suspense>
)
