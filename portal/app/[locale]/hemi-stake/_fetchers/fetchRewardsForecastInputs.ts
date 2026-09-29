import { type QueryClient } from '@tanstack/react-query'
import { type Address, type Chain, type Client } from 'viem'

import { getClassDenominatorsQueryOptions } from '../_hooks/classDenominators'
import { getEpochStreamsQueryOptions } from '../_hooks/epochStreams'
import { getBaselinePot } from '../_utils/epochPot'

// Past this, roughly seven weeks, the last baseline
// says too little about the current epoch to stand in for it.
export const maxEpochsBack = 8

export const fetchRewardsForecastInputs = async function (
  queryClient: QueryClient,
  {
    chainId,
    currentEpoch,
    firstFundableEpoch,
    hemiClient,
    token,
  }: {
    chainId: Chain['id']
    currentEpoch: number
    firstFundableEpoch: number
    hemiClient: Client
    token: Address
  },
) {
  const findFunded = async function () {
    const oldestEpoch = Math.max(
      currentEpoch - maxEpochsBack,
      firstFundableEpoch,
    )

    for (let epoch = currentEpoch; epoch >= oldestEpoch; epoch--) {
      const streams = await queryClient.fetchQuery(
        getEpochStreamsQueryOptions({ chainId, epoch, hemiClient, token }),
      )
      const pot = getBaselinePot(streams)

      if (pot > BigInt(0)) {
        return { epoch, pot }
      }
    }

    return undefined
  }

  const [{ transferable: transferableClassWeight }, funded] = await Promise.all(
    [
      queryClient.fetchQuery(
        getClassDenominatorsQueryOptions({
          chainId,
          epoch: currentEpoch,
          hemiClient,
        }),
      ),
      findFunded(),
    ],
  )

  if (!funded) {
    return { transferableClassWeight }
  }

  return {
    carriedFrom: funded.epoch === currentEpoch ? undefined : funded.epoch,
    transferableClassPot: funded.pot,
    transferableClassWeight,
  }
}
