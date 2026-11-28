import { type QueryClient } from '@tanstack/react-query'
import { type Address, type Chain, type Client } from 'viem'

import { getClassDenominatorsQueryOptions } from '../_hooks/classDenominators'
import { getEpochStreamsQueryOptions } from '../_hooks/epochStreams'
import { getBaselineByClass } from '../_utils/epochBaseline'
import { type RewardClass, rewardClasses } from '../_utils/rewardClass'

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
  const findFundedByClass = async function () {
    const oldestEpoch = Math.max(
      currentEpoch - maxEpochsBack,
      firstFundableEpoch,
    )
    const funded = new Map<RewardClass, { baseline: bigint; epoch: number }>()

    for (
      let epoch = currentEpoch;
      epoch >= oldestEpoch && funded.size < rewardClasses.length;
      epoch--
    ) {
      const streams = await queryClient.fetchQuery(
        getEpochStreamsQueryOptions({ chainId, epoch, hemiClient, token }),
      )
      const baselines = getBaselineByClass(streams)

      rewardClasses
        .filter(
          rewardClass =>
            !funded.has(rewardClass) && baselines[rewardClass] > BigInt(0),
        )
        .forEach(rewardClass =>
          funded.set(rewardClass, { baseline: baselines[rewardClass], epoch }),
        )
    }

    return funded
  }

  const [denominators, funded] = await Promise.all([
    queryClient.fetchQuery(
      getClassDenominatorsQueryOptions({
        chainId,
        epoch: currentEpoch,
        hemiClient,
      }),
    ),
    findFundedByClass(),
  ])

  const toClassInputs = function (rewardClass: RewardClass) {
    const fundedClass = funded.get(rewardClass)

    return {
      baseline: fundedClass?.baseline,
      carriedFrom:
        fundedClass !== undefined && fundedClass.epoch !== currentEpoch
          ? fundedClass.epoch
          : undefined,
      weight: denominators[rewardClass],
    }
  }

  return {
    forfeitable: toClassInputs('forfeitable'),
    locked: toClassInputs('locked'),
    transferable: toClassInputs('transferable'),
  }
}
