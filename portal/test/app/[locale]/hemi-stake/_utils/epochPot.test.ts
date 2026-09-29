import { getBaselinePot } from 'app/[locale]/hemi-stake/_utils/epochPot'
import { stringToHex } from 'viem'
import { describe, expect, it } from 'vitest'

const label = (text: string) => stringToHex(text, { size: 32 })

const stream = (text: string, transferable: number) => ({
  fundedByClass: { transferable: BigInt(transferable) },
  label: label(text),
})

describe('getBaselinePot', function () {
  it('takes the transferable share of the baseline stream', function () {
    expect(
      getBaselinePot([stream('baseline', 4_166_666), stream('other', 1)]),
    ).toBe(BigInt(4_166_666))
  })

  it('leaves the fees out, they are collected rather than budgeted', function () {
    expect(getBaselinePot([stream('transaction-fees', 15_000)])).toBe(BigInt(0))
  })

  it('adds up every baseline stream, since a label can repeat', function () {
    expect(
      getBaselinePot([
        stream('baseline', 4_000_000),
        stream('baseline', 166_666),
      ]),
    ).toBe(BigInt(4_166_666))
  })

  it('finds the baseline wherever it sits in the list', function () {
    expect(
      getBaselinePot([
        stream('transaction-fees', 15_000),
        stream('baseline', 4_166_666),
      ]),
    ).toBe(BigInt(4_166_666))
  })

  it('has no pot to offer for an epoch nothing funded', function () {
    expect(getBaselinePot([])).toBe(BigInt(0))
  })
})
