import { useHemiToken } from 'hooks/useHemiToken'
import Skeleton from 'react-loading-skeleton'

import { Stake } from './stake'
import { StakeDrawers } from './stakeDrawers'

export const StakeForm = function () {
  const hemiToken = useHemiToken()

  if (!hemiToken) {
    return (
      <Skeleton
        className="min-h-136 rounded-2xl"
        containerClassName="flex justify-center"
      />
    )
  }

  return (
    <>
      <StakeDrawers />
      <Stake />
    </>
  )
}
