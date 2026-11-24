import { useNetworkType } from 'hooks/useNetworkType'
import { Outlet } from 'react-router'
import { isStakeEnabledOnTestnet } from 'utils/stake'

import { NotFound } from '../not-found'

import StakeLayoutClient from './_components/stakeLayoutClient'

export const StakeLayout = function () {
  const [networkType] = useNetworkType()

  if (!isStakeEnabledOnTestnet(networkType)) {
    return <NotFound />
  }

  return (
    <StakeLayoutClient>
      <Outlet />
    </StakeLayoutClient>
  )
}
