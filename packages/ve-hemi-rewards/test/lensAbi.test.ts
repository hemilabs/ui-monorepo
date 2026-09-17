import { describe, expect, it } from 'vitest'

import { veHemiEpochRewardsLensAbi } from '../lensAbi.ts'

const functions = veHemiEpochRewardsLensAbi.filter(
  entry => entry.type === 'function',
)

const outputsOf = function (name: string) {
  const entry = functions.find(fn => fn.name === name)
  return (entry?.outputs ?? []).flatMap(output =>
    'components' in output && output.components
      ? output.components.map(component => component.name)
      : [output.name],
  )
}

// The Lens is re-vendored whenever the contracts change, and a dropped field degrades
// silently - the share math stops being able to explain itself, or an amount starts
// rendering against a hard-coded 18. These turn that into a failed build.
describe('veHemiEpochRewardsLensAbi', function () {
  it('exposes exactly the surface the integration reads through', function () {
    expect(functions.map(fn => fn.name).sort()).toEqual([
      'allTokens',
      'claimableByEpoch',
      'claimableByToken',
      'claimableByTokenAll',
      'epochFunding',
      'planClaim',
      'rewards',
      'streamsForEpoch',
      'systemState',
      'weightAt',
    ])
  })

  // The Lens holds no funds and returns `rewards.preview(...)` verbatim. A non-view
  // entry would mean a second implementation of the payout arithmetic.
  it('is entirely view', function () {
    expect(
      functions.filter(fn => fn.stateMutability !== 'view').map(fn => fn.name),
    ).toEqual([])
  })

  // A share is `weight / classDenominator` plus the residual's share of the transferable
  // pot, never `weight / totalSupply`. `classKnown` separates "pays nothing" from
  // "cannot be determined".
  it('weightAt carries everything a share and its explanation need', function () {
    expect(outputsOf('weightAt')).toEqual([
      'weight',
      'owner',
      'totalSupply',
      'instant',
      'class_',
      'classDenominator',
      'residualWeight',
      'transferableDenominator',
      'classKnown',
    ])
  })

  // `pageSize` must come from the contract. Recomputing it is how a claim silently
  // settles assets 8..15 and never 0..7.
  it('planClaim returns the page size rather than leaving it to be derived', function () {
    expect(outputsOf('planClaim')).toContain('pageSize')
  })

  // hemiBTC is 8dp, so the decimals travel with the amount.
  it('claimableByToken reports decimals beside every amount', function () {
    expect(outputsOf('claimableByToken')).toEqual([
      'token',
      'symbol',
      'decimals',
      'claimable',
      'carry',
    ])
  })

  // `resolved` is not `paid`, and `swept` closes an epoch for good. Without these a
  // history table renders a legitimate zero as a missing payment.
  it('claimableByEpoch distinguishes resolved and swept', function () {
    expect(outputsOf('claimableByEpoch')).toEqual([
      'epoch',
      'funded',
      'claimable',
      'resolved',
      'swept',
    ])
  })
})
