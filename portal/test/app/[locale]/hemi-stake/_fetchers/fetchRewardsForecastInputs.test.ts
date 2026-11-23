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

const baselineAmount = BigInt('4166666660000000000000000')
const lockedAmount = BigInt('1370000000000000000000000')
const forfeitableAmount = BigInt('259700000000000000000000')

const stream = (
  text,
  {
    forfeitable = BigInt(0),
    locked = BigInt(0),
    transferable = BigInt(0),
  } = {},
) => [
  {
    fundedByClass: { forfeitable, locked, transferable },
    label: stringToHex(text, { size: 32 }),
  },
]

const everyClass = stream('baseline', {
  forfeitable: forfeitableAmount,
  locked: lockedAmount,
  transferable: baselineAmount,
})

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

const seedEmptyWindow = function (queryClient, overrides = {}) {
  const streamsByEpoch = {}
  for (
    let epoch = currentEpoch;
    epoch >= currentEpoch - maxEpochsBack;
    epoch--
  ) {
    streamsByEpoch[epoch] = []
  }
  seed(queryClient, { ...streamsByEpoch, ...overrides })
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
  it('takes the baseline of the epoch in progress when it is funded', async function () {
    const queryClient = createTestQueryClient()
    seed(queryClient, { [currentEpoch]: everyClass })

    const result = await fetchInputs(queryClient)

    expect(result.transferable.baseline).toBe(baselineAmount)
    expect(result.transferable.carriedFrom).toBeUndefined()
  })

  it('carries the last funded baseline when the epoch in progress is empty', async function () {
    const queryClient = createTestQueryClient()
    seed(queryClient, {
      [currentEpoch]: [],
      [currentEpoch - 1]: everyClass,
    })

    const result = await fetchInputs(queryClient)

    expect(result.transferable.baseline).toBe(baselineAmount)
    expect(result.transferable.carriedFrom).toBe(currentEpoch - 1)
  })

  it('skips an epoch that only collected fees', async function () {
    const queryClient = createTestQueryClient()
    seed(queryClient, {
      [currentEpoch]: stream('transaction-fees', {
        transferable: BigInt('15000000000000000000000'),
      }),
      [currentEpoch - 1]: everyClass,
    })

    const result = await fetchInputs(queryClient)

    expect(result.transferable.carriedFrom).toBe(currentEpoch - 1)
  })

  it('stops once every class has a baseline, leaving the rest unread', async function () {
    const queryClient = createTestQueryClient()
    seed(queryClient, { [currentEpoch]: everyClass })

    await fetchInputs(queryClient)

    expect(getEpochStreams).not.toHaveBeenCalled()
  })

  it('carries each class from its own most recent funded epoch', async function () {
    const queryClient = createTestQueryClient()
    seed(queryClient, {
      [currentEpoch]: stream('baseline', { locked: lockedAmount }),
      [currentEpoch - 1]: stream('baseline', {
        forfeitable: forfeitableAmount,
        transferable: baselineAmount,
      }),
    })

    const result = await fetchInputs(queryClient)

    expect(result.locked.baseline).toBe(lockedAmount)
    expect(result.locked.carriedFrom).toBeUndefined()
    expect(result.transferable.baseline).toBe(baselineAmount)
    expect(result.transferable.carriedFrom).toBe(currentEpoch - 1)
  })

  it('keeps walking for a class the newest epoch left unfunded', async function () {
    const queryClient = createTestQueryClient()
    seedEmptyWindow(queryClient, {
      [currentEpoch]: stream('baseline', {
        locked: lockedAmount,
        transferable: baselineAmount,
      }),
      [currentEpoch - 3]: stream('baseline', {
        forfeitable: forfeitableAmount,
      }),
    })

    const result = await fetchInputs(queryClient)

    expect(result.forfeitable.baseline).toBe(forfeitableAmount)
    expect(result.forfeitable.carriedFrom).toBe(currentEpoch - 3)
    expect(result.transferable.carriedFrom).toBeUndefined()
  })

  it('gives up past the lookback and offers no baseline at all', async function () {
    const queryClient = createTestQueryClient()
    seedEmptyWindow(queryClient)

    const result = await fetchInputs(queryClient)

    expect(result.forfeitable.baseline).toBeUndefined()
    expect(result.locked.baseline).toBeUndefined()
    expect(result.transferable.baseline).toBeUndefined()
    expect(result.transferable.carriedFrom).toBeUndefined()
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

    expect(result.transferable.baseline).toBeUndefined()
    expect(getEpochStreams).not.toHaveBeenCalled()
  })

  it('reads the weight of every class from the epoch in progress', async function () {
    const queryClient = createTestQueryClient()
    seed(queryClient, {
      [currentEpoch]: [],
      [currentEpoch - 1]: everyClass,
    })

    const result = await fetchInputs(queryClient)

    expect(result.forfeitable.weight).toBe(denominators.forfeitable)
    expect(result.locked.weight).toBe(denominators.locked)
    expect(result.transferable.weight).toBe(denominators.transferable)
  })
  it('never walks past the lookback for a class nobody ever funded', async function () {
    const queryClient = createTestQueryClient()
    seedEmptyWindow(queryClient, {
      [currentEpoch]: stream('baseline', {
        locked: lockedAmount,
        transferable: baselineAmount,
      }),
    })

    const result = await fetchInputs(queryClient)

    expect(result.forfeitable.baseline).toBeUndefined()
    expect(result.transferable.carriedFrom).toBeUndefined()
    expect(getEpochStreams).not.toHaveBeenCalled()
  })
})
