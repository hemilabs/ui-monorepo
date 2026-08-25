import { useDocumentTitle } from 'hooks/useDocumentTitle'
import { Outlet } from 'react-router'

import StakeLayoutClient from './_components/stakeLayoutClient'

export default function StakeLayout() {
  useDocumentTitle('Stake | Hemi Portal')

  return (
    <StakeLayoutClient>
      <Outlet />
    </StakeLayoutClient>
  )
}
