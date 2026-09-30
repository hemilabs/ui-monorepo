import { type StakingPosition } from 'types/stakingDashboard'
import { describe, expect, it } from 'vitest'

import {
  prependPosition,
  updatePosition,
} from '../../../../../app/[locale]/hemi-stake/_utils/positionsCache'
import { createTestQueryClient } from '../../../../createTestQueryClient'

const queryKey = ['staking-positions']

const position = (tokenId: number) =>
  ({ amount: BigInt(10), tokenId: BigInt(tokenId) }) as StakingPosition

const addAmount = (stakingPosition: StakingPosition) => ({
  ...stakingPosition,
  amount: stakingPosition.amount + BigInt(5),
})

const createFailedQuery = async function () {
  const queryClient = createTestQueryClient()
  await queryClient
    .fetchQuery({
      queryFn: () => Promise.reject(new Error('positions request failed')),
      queryKey,
    })
    .catch(() => undefined)
  return queryClient
}

describe('prependPosition', function () {
  it('adds the new position first', function () {
    expect(prependPosition(position(3))([position(1), position(2)])).toEqual([
      position(3),
      position(1),
      position(2),
    ])
  })

  it('keeps a failed positions query failed, without data', async function () {
    const queryClient = await createFailedQuery()

    queryClient.setQueryData(queryKey, prependPosition(position(3)))

    expect(queryClient.getQueryState(queryKey)).toMatchObject({
      data: undefined,
      status: 'error',
    })
  })
})

describe('updatePosition', function () {
  it('updates only the position with the given tokenId', function () {
    expect(
      updatePosition({ tokenId: BigInt(2), update: addAmount })([
        position(1),
        position(2),
      ]),
    ).toEqual([position(1), { ...position(2), amount: BigInt(15) }])
  })

  it('keeps a failed positions query failed, without data', async function () {
    const queryClient = await createFailedQuery()

    queryClient.setQueryData(
      queryKey,
      updatePosition({ tokenId: BigInt(2), update: addAmount }),
    )

    expect(queryClient.getQueryState(queryKey)).toMatchObject({
      data: undefined,
      status: 'error',
    })
  })
})
