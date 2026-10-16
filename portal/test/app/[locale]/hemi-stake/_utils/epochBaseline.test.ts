import { getBaselineByClass } from 'app/[locale]/hemi-stake/_utils/epochBaseline'
import { stringToHex } from 'viem'
import { describe, expect, it } from 'vitest'

const label = (text: string) => stringToHex(text, { size: 32 })

const stream = (
  text: string,
  { forfeitable = 0, locked = 0, transferable = 0 } = {},
) => ({
  fundedByClass: {
    forfeitable: BigInt(forfeitable),
    locked: BigInt(locked),
    transferable: BigInt(transferable),
  },
  label: label(text),
})

const none = {
  forfeitable: BigInt(0),
  locked: BigInt(0),
  transferable: BigInt(0),
}

describe('getBaselineByClass', function () {
  it('takes every class of the baseline stream', function () {
    expect(
      getBaselineByClass([
        stream('baseline', {
          forfeitable: 259_700,
          locked: 1_370_000,
          transferable: 4_166_666,
        }),
        stream('other', { transferable: 1 }),
      ]),
    ).toEqual({
      forfeitable: BigInt(259_700),
      locked: BigInt(1_370_000),
      transferable: BigInt(4_166_666),
    })
  })

  it('reports zero for the classes the baseline left unfunded', function () {
    expect(
      getBaselineByClass([stream('baseline', { locked: 1_370_000 })]),
    ).toEqual({
      forfeitable: BigInt(0),
      locked: BigInt(1_370_000),
      transferable: BigInt(0),
    })
  })

  it('leaves the fees out, they are collected rather than budgeted', function () {
    expect(
      getBaselineByClass([
        stream('transaction-fees', { transferable: 15_000 }),
      ]),
    ).toEqual(none)
  })

  it('adds up every baseline stream per class, since a label can repeat', function () {
    expect(
      getBaselineByClass([
        stream('baseline', { locked: 1_000_000, transferable: 4_000_000 }),
        stream('baseline', { locked: 370_000, transferable: 166_666 }),
      ]),
    ).toEqual({
      forfeitable: BigInt(0),
      locked: BigInt(1_370_000),
      transferable: BigInt(4_166_666),
    })
  })

  it('finds the baseline wherever it sits in the list', function () {
    expect(
      getBaselineByClass([
        stream('transaction-fees', { transferable: 15_000 }),
        stream('baseline', { transferable: 4_166_666 }),
      ]),
    ).toEqual({
      forfeitable: BigInt(0),
      locked: BigInt(0),
      transferable: BigInt(4_166_666),
    })
  })

  it('has no baseline to offer for an epoch nothing funded', function () {
    expect(getBaselineByClass([])).toEqual(none)
  })
})
