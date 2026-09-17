import { describe, expect, it } from 'vitest'

import { veHemiEpochRewardsAbi } from '../epochRewardsAbi.ts'

const inputsOf = function (name: string) {
  const entry = veHemiEpochRewardsAbi.find(
    fragment => fragment.type === 'function' && fragment.name === name,
  )
  return (entry && 'inputs' in entry ? entry.inputs : []).map(
    input => `${input.type} ${input.name}`,
  )
}

/**
 * The argument order of the three reads where getting it wrong is silent.
 *
 * `hasClaimed`, `pendingCarry` and `firstUnclaimedEpoch` take a holder and a token, both
 * `address`, and the v2 bundle swapped them. Since the two share a type the selector did
 * not move, so a call written for the old order compiles, validates, succeeds and reads
 * the wrong storage slot - `pendingCarry` answers 0 and `hasClaimed` answers false, with
 * no revert and nothing in the logs.
 *
 * Nothing calls these three yet. This is here so whoever first does can't inherit a
 * stale ABI, and so a re-vendor from an older cut fails the build.
 */
describe('veHemiEpochRewardsAbi', function () {
  it.each([
    [
      'hasClaimed',
      ['uint256 tokenId', 'address holder', 'address token', 'uint32 e'],
    ],
    ['pendingCarry', ['uint256 tokenId', 'address holder', 'address token']],
    [
      'firstUnclaimedEpoch',
      [
        'uint256 tokenId',
        'address holder',
        'address token',
        'uint32 from',
        'uint32 to',
      ],
    ],
  ])('%s takes the holder before the token', function (name, expected) {
    expect(inputsOf(name)).toEqual(expected)
  })

  // `claim` is what the other three were changed to match.
  it('claim puts the holder second and takes no token', function () {
    expect(inputsOf('claim')).toEqual([
      'uint256 tokenId',
      'address holder',
      'uint32 fromEpoch',
      'uint32 toEpoch',
    ])
  })

  // A re-vendor that drops entries came from the wrong cut.
  it('carries the whole v2 surface', function () {
    expect(veHemiEpochRewardsAbi).toHaveLength(156)
  })
})
