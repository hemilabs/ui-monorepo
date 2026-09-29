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
  const weight = queryClient.fetchQuery(
    getClassDenominatorsQueryOptions({
      chainId,
      epoch: currentEpoch,
      hemiClient,
    }),
  )

  const oldestEpoch = Math.max(currentEpoch - maxEpochsBack, firstFundableEpoch)
  let funded: { epoch: number; pot: bigint } | undefined

  for (let epoch = currentEpoch; epoch >= oldestEpoch && !funded; epoch--) {
    const streams = await queryClient.fetchQuery(
      getEpochStreamsQueryOptions({ chainId, epoch, hemiClient, token }),
    )
    const pot = getBaselinePot(streams)

    if (pot > BigInt(0)) {
      funded = { epoch, pot }
    }
  }

  const { transferable: transferableClassWeight } = await weight

  if (!funded) {
    return { transferableClassWeight }
  }

  return {
    carriedFrom: funded.epoch === currentEpoch ? undefined : funded.epoch,
    transferableClassPot: funded.pot,
    transferableClassWeight,
  }
}
