import { useDocumentTitle } from 'hooks/useDocumentTitle'
import { Outlet } from 'react-router'

import StakeLayoutClient from './_components/stakeLayoutClient'

export const StakeLayout = function () {
  useDocumentTitle('Stake | Hemi Portal')

  return (
    <StakeLayoutClient>
      <Outlet />
    </StakeLayoutClient>
  )
}
