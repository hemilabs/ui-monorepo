import { featureFlags } from 'app/featureFlags'
import { useDocumentTitle } from 'hooks/useDocumentTitle'
import { Outlet } from 'react-router'

import { NotFound } from '../not-found'

export const HemiStakeLayout = function () {
  useDocumentTitle('Hemi Stake | Hemi Portal')

  if (!featureFlags.enableHemiStakePage) {
    return <NotFound />
  }

  return <Outlet />
}
