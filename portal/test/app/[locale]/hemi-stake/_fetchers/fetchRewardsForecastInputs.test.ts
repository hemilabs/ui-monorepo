import {
  fetchRewardsForecastInputs,
  maxEpochsBack,
} from 'app/[locale]/hemi-stake/_fetchers/fetchRewardsForecastInputs'
import { getClassDenominatorsQueryOptions } from 'app/[locale]/hemi-stake/_hooks/classDenominators'
import { getEpochStreamsQueryOptions } from 'app/[locale]/hemi-stake/_hooks/epochStreams'
import { createTestQueryClient } from 'test/createTestQueryClient'
import { getEpochStreams } from 've-hemi-epoch-rewards/actions'
import { stringToHex } from 'viem'
import { describe, expect, it, vi } from 'vitest'

vi.mock('ve-hemi-epoch-rewards/actions')

const chainId = 43111
const currentEpoch = 3404
const firstFundableEpoch = 3000
const hemiClient = {}
const token = '0x99e3dE3817F6081B2568208337ef83295b7f591D'

const denominators = {
  forfeitable: BigInt('79629166000000000000000000'),
  locked: BigInt('398561993000000000000000000'),
  transferable: BigInt('11842292000000000000000000'),
}

const baseline = (transferable: bigint) => [
  {
    fundedByClass: { forfeitable: BigInt(0), locked: BigInt(0), transferable },
    label: stringToHex('baseline', { size: 32 }),
  },
]

const fees = [
  {
    fundedByClass: {
      forfeitable: BigInt(0),
      locked: BigInt(0),
      transferable: BigInt('15000000000000000000000'),
    },
    label: stringToHex('transaction-fees', { size: 32 }),
  },
]

const pot = BigInt('4166666660000000000000000')

const seed = function (queryClient, streamsByEpoch) {
  queryClient.setQueryData(
    getClassDenominatorsQueryOptions({
      chainId,
      epoch: currentEpoch,
      hemiClient,
    }).queryKey,
    denominators,
  )
  Object.entries(streamsByEpoch).forEach(function ([epoch, streams]) {
    queryClient.setQueryData(
      getEpochStreamsQueryOptions({
        chainId,
        epoch: Number(epoch),
        hemiClient,
        token,
      }).queryKey,
      streams,
    )
  })
}

const fetchInputs = queryClient =>
  fetchRewardsForecastInputs(queryClient, {
    chainId,
    currentEpoch,
    firstFundableEpoch,
    hemiClient,
    token,
  })

describe('fetchRewardsForecastInputs', function () {
  it('takes the pot of the epoch in progress when it is funded', async function () {
    const queryClient = createTestQueryClient()
    seed(queryClient, { [currentEpoch]: baseline(pot) })

    const result = await fetchInputs(queryClient)

    expect(result.transferableClassPot).toBe(pot)
    expect(result.carriedFrom).toBeUndefined()
  })

  it('carries the last funded baseline when the epoch in progress is empty', async function () {
    const queryClient = createTestQueryClient()
    seed(queryClient, {
      [currentEpoch]: [],
      [currentEpoch - 1]: baseline(pot),
    })

    const result = await fetchInputs(queryClient)

    expect(result.transferableClassPot).toBe(pot)
    expect(result.carriedFrom).toBe(currentEpoch - 1)
  })

  it('skips an epoch that only collected fees', async function () {
    const queryClient = createTestQueryClient()
    seed(queryClient, {
      [currentEpoch]: fees,
      [currentEpoch - 1]: baseline(pot),
    })

    const result = await fetchInputs(queryClient)

    expect(result.carriedFrom).toBe(currentEpoch - 1)
  })

  it('stops at the first epoch it finds, leaving the rest unread', async function () {
    const queryClient = createTestQueryClient()
    // Only these two are cached. Walking further would have to call the action.
    seed(queryClient, {
      [currentEpoch]: [],
      [currentEpoch - 1]: baseline(pot),
    })

    await fetchInputs(queryClient)

    expect(getEpochStreams).not.toHaveBeenCalled()
  })

  it('gives up past the lookback and offers no pot at all', async function () {
    const queryClient = createTestQueryClient()
    const empty = {}
    for (
      let epoch = currentEpoch;
      epoch >= currentEpoch - maxEpochsBack;
      epoch--
    ) {
      empty[epoch] = []
    }
    seed(queryClient, empty)

    const result = await fetchInputs(queryClient)

    expect(result.transferableClassPot).toBeUndefined()
    expect(result.carriedFrom).toBeUndefined()
  })

  it('stops at the first fundable epoch rather than reading below it', async function () {
    const queryClient = createTestQueryClient()
    const firstFundable = currentEpoch - 2
    seed(queryClient, {
      [currentEpoch]: [],
      [currentEpoch - 1]: [],
      [firstFundable]: [],
    })

    const result = await fetchRewardsForecastInputs(queryClient, {
      chainId,
      currentEpoch,
      firstFundableEpoch: firstFundable,
      hemiClient,
      token,
    })

    expect(result.transferableClassPot).toBeUndefined()
    expect(getEpochStreams).not.toHaveBeenCalled()
  })

  it('takes a baseline that funded only the locked class as no pot', async function () {
    const queryClient = createTestQueryClient()
    seed(queryClient, {
      [currentEpoch]: baseline(BigInt(0)),
      [currentEpoch - 1]: baseline(pot),
    })

    const result = await fetchInputs(queryClient)

    expect(result.carriedFrom).toBe(currentEpoch - 1)
    expect(result.transferableClassPot).toBe(pot)
  })

  it('reads the weight from the epoch in progress even when the pot was carried', async function () {
    const queryClient = createTestQueryClient()
    seed(queryClient, {
      [currentEpoch]: [],
      [currentEpoch - 1]: baseline(pot),
    })

    const result = await fetchInputs(queryClient)

    expect(result.transferableClassWeight).toBe(denominators.transferable)
  })
})
