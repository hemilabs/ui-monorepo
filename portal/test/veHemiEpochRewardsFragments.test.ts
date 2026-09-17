import { veHemiEpochRewardsFragments } from 've-hemi-actions/epochRewardsFragments'
import { veHemiEpochRewardsAbi } from 've-hemi-rewards/epochRewardsAbi'
import { describe, expect, it } from 'vitest'

// `ve-hemi-actions` carries copies of three VeHemiEpochRewards entries rather than
// importing them, because a workspace edge onto a viem-dependent package rewrites
// ~1,100 lines of lockfile. This is what stops the copies drifting: the Portal already
// depends on both packages, so it can compare them without adding an edge anywhere.
describe('veHemiEpochRewardsFragments', function () {
  it('matches the vendored ABI entry for entry', function () {
    for (const fragment of veHemiEpochRewardsFragments) {
      const vendored = veHemiEpochRewardsAbi.find(
        entry => entry.type === 'function' && entry.name === fragment.name,
      )
      expect(
        vendored,
        `${fragment.name} is missing from the vendored ABI`,
      ).toEqual(fragment)
    }
  })
})
